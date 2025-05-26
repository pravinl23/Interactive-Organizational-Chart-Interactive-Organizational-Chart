<template>
  <div v-if="isVisible" class="employee-node">
    <!-- Employee Card -->
    <div 
      ref="employeeCardRef"
      class="employee-card transition-all duration-300 ease-in-out cursor-pointer"
      :class="{ 
        'expanded': expanded,
        'highlighted': props.highlightedEmployeeId === props.employee.id
      }"
      :style="{ backgroundColor: levelColors[employee.level] + '10' }"
      @click="toggleExpanded"
    >
      <!-- Avatar -->
      <div 
        class="avatar"
        :style="{ backgroundColor: levelColors[employee.level] }"
      >
        {{ getInitials(employee.name) }}
      </div>

      <!-- Basic Info (Always Visible) -->
      <div class="basic-info">
        <h3 class="employee-name">{{ employee.name }}</h3>
        <p class="employee-title">{{ employee.jobTitle }}</p>
        
        <!-- Department Badge -->
        <div class="badge department-badge">{{ employee.department }}</div>
        
        <!-- Location Badge -->
        <div class="badge location-badge">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          {{ employee.location }}
        </div>
      </div>

      <!-- Expand/Collapse Indicator -->
      <div class="expand-indicator">
        <span class="text-xs text-gray-500">
          {{ expanded ? 'Click to collapse' : 'Click to expand' }}
        </span>
        <div class="expand-icon">
          {{ expanded ? '▲' : '▼' }}
        </div>
      </div>

      <!-- Expanded Details (Conditional) -->
      <div 
        v-if="expanded" 
        class="expanded-details transition-all duration-300 ease-in-out"
      >
        <!-- Layer Badge -->
        <div class="badge layer-badge">Layer: {{ employee.level }}</div>
        
        <!-- Metrics -->
        <div class="metrics">
          <div class="metric">
            <span class="metric-label">Descendants:</span>
            <span class="metric-value">{{ employee.descendantCount }}</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">Non-leaf descendants:</span>
            <span class="metric-value">{{ employee.nonLeafDescendants }}</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">Manager count:</span>
            <span class="metric-value">{{ employee.metrics.managerCount }}</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">Manager cost:</span>
            <span class="metric-value">${{ formatCurrency(employee.metrics.managerCost) }} / year</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">IC count:</span>
            <span class="metric-value">{{ employee.metrics.icCount }}</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">IC cost:</span>
            <span class="metric-value">${{ formatCurrency(employee.metrics.icCost) }} / year</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">Total cost:</span>
            <span class="metric-value">${{ formatCurrency(employee.metrics.totalCost) }} / year</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">Management cost ratio:</span>
            <span class="metric-value">{{ employee.metrics.managementCostRatio }}</span>
          </div>
        </div>

        <!-- Hierarchy Toggle (only when expanded) -->
        <div v-if="employee.hasChildren" class="hierarchy-controls">
          <button 
            @click.stop="toggleHierarchy"
            class="hierarchy-btn"
          >
            {{ employee.isExpanded ? 'Collapse Team' : 'Expand Team' }}
            ({{ employee.directReports }} direct reports)
          </button>
          <!-- Debug info -->
          <div v-if="employee.level >= 8" class="text-xs text-gray-500 mt-1">
            Level {{ employee.level }} | Children: {{ employee.children.length }} | 
            Child levels: {{ employee.children.map(c => c.level).join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Children (Recursive) - Positioned below the card -->
    <div 
      v-if="employee.isExpanded && employee.children && employee.children.length > 0" 
      class="children-section"
    >
      <div class="children-grid">
        <EmployeeNode
          v-for="child in employee.children"
          :key="child.id"
          :employee="child"
          :level-colors="levelColors"
          :visible-layers="visibleLayers"
          :highlighted-employee-id="highlightedEmployeeId"
          @toggle-hierarchy="$emit('toggle-hierarchy', $event)"
          @employee-highlighted="$emit('employee-highlighted', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// Define props
const props = defineProps({
  employee: {
    type: Object,
    required: true
  },
  levelColors: {
    type: Object,
    required: true
  },
  visibleLayers: {
    type: Set,
    required: true
  },
  highlightedEmployeeId: {
    type: String,
    default: null
  }
})

// Define emits
const emit = defineEmits(['toggle-hierarchy', 'employee-highlighted'])

// Local state for card expansion
const expanded = ref(false)
const employeeCardRef = ref(null)

// Watch for when this employee becomes highlighted
watch(() => props.highlightedEmployeeId, (newId) => {
  if (newId === props.employee.id && employeeCardRef.value) {
    nextTick(() => {
      const rect = employeeCardRef.value.getBoundingClientRect()
      const scrollContainer = document.querySelector('.chart-scroll-container-fullscreen')
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect()
        emit('employee-highlighted', {
          employeeId: props.employee.id,
          element: employeeCardRef.value,
          position: {
            x: rect.left - containerRect.left + scrollContainer.scrollLeft,
            y: rect.top - containerRect.top + scrollContainer.scrollTop,
            width: rect.width,
            height: rect.height
          }
        })
      }
    })
  }
})

// Computed properties
const isVisible = computed(() => {
  return props.visibleLayers.has(props.employee.level)
})

// Methods
const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const toggleHierarchy = () => {
  emit('toggle-hierarchy', props.employee)
}

const getInitials = (name) => {
  if (!name) return '??'
  const nameParts = name.trim().split(' ')
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase()
  }
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
}

const formatCurrency = (amount) => {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K'
  }
  return amount.toLocaleString()
}
</script>

<style scoped>
.employee-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.employee-card {
  width: 320px;
  min-height: 200px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: relative;
  flex-shrink: 0;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

.employee-card.expanded {
  min-height: 400px;
}

.employee-card.highlighted {
  border: 3px solid #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.4), 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  }
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin: 0 auto 12px;
}

.basic-info {
  text-align: center;
  margin-bottom: 12px;
}

.employee-name {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.employee-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin: 2px;
}

.department-badge {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.location-badge {
  background-color: #dbeafe;
  color: #2563eb;
}

.layer-badge {
  background-color: #d1fae5;
  color: #059669;
}

.expand-indicator {
  text-align: center;
  margin: 12px 0;
  padding: 8px;
  border-top: 1px solid #e5e7eb;
}

.expand-icon {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.expanded-details {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  margin-top: 12px;
}

.metrics {
  margin: 12px 0;
  text-align: left;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}

.metric-label {
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  color: #1f2937;
  font-weight: 600;
}

.hierarchy-controls {
  text-align: center;
  margin-top: 16px;
}

.hierarchy-btn {
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hierarchy-btn:hover {
  background: #374151;
}

.children-section {
  margin-top: 2rem;
  width: max-content;
  min-width: 100%;
  display: flex;
  justify-content: center;
}

.children-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 4rem;
  justify-content: flex-start;
  align-items: flex-start;
  min-width: max-content;
}

/* Ensure horizontal layout extends as needed */
@media (min-width: 768px) {
  .children-grid {
    gap: 5rem;
  }
}
</style> 