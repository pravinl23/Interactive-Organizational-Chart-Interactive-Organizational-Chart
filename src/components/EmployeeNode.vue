<template>
  <!-- Render employee node only if it should be visible (based on level visibility) -->
  <div v-if="isVisible" class="employee-node">

    <!-- Main Employee Card -->
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

      <!-- Avatar with initials (or later, a photo) -->
      <div 
        class="avatar"
        :style="{ backgroundColor: levelColors[employee.level] }"
      >
        {{ getInitials(employee.name) }}
      </div>

      <!-- Basic employee info (always shown) -->
      <div class="basic-info">
        <h3 class="employee-name">{{ employee.name }}</h3>
        <p class="employee-title">{{ employee.jobTitle }}</p>

        <!-- Department and Location badges -->
        <div class="badge department-badge">{{ employee.department }}</div>
        <div class="badge location-badge">
          <svg class="location-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          {{ employee.location }}
        </div>
      </div>

      <!-- Show expand/collapse UI -->
      <div class="expand-indicator">
        <span class="text-xs text-gray-500">
          {{ expanded ? 'Click to collapse' : 'Click to expand' }}
        </span>
        <div class="expand-icon">
          {{ expanded ? '▲' : '▼' }}
        </div>
      </div>

      <!-- Expanded metrics and team controls -->
      <div 
        v-if="expanded" 
        class="expanded-details transition-all duration-300 ease-in-out"
      >

        <!-- Show what layer in hierarchy the employee is -->
        <div class="badge layer-badge">Layer: {{ employee.level }}</div>

        <!-- Metrics section with calculated info -->
        <div class="metrics">
          <div class="metric" v-for="metric in [
            ['Descendants', employee.descendantCount],
            ['Non-leaf descendants', employee.nonLeafDescendants],
            ['Manager count', employee.metrics.managerCount],
            ['Manager cost', '$' + formatCurrency(employee.metrics.managerCost) + ' / year'],
            ['IC count', employee.metrics.icCount],
            ['IC cost', '$' + formatCurrency(employee.metrics.icCost) + ' / year'],
            ['Total cost', '$' + formatCurrency(employee.metrics.totalCost) + ' / year'],
            ['Management cost ratio', employee.metrics.managementCostRatio]
          ]" :key="metric[0]">
            <span class="metric-label">{{ metric[0] }}:</span>
            <span class="metric-value">{{ metric[1] }}</span>
          </div>
        </div>

        <!-- Button to expand/collapse children -->
        <div v-if="employee.hasChildren" class="hierarchy-controls">
          <button 
            @click.stop="toggleHierarchy"
            class="hierarchy-btn"
          >
            {{ employee.isExpanded ? 'Collapse Team' : 'Expand Team' }}
            ({{ employee.directReports }} direct reports)
          </button>

          <!-- Debug info for deep layers -->
          <div v-if="employee.level >= 8" class="text-xs text-gray-500 mt-1">
            Level {{ employee.level }} | Children: {{ employee.children.length }} | 
            Child levels: {{ employee.children.map(c => c.level).join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Recursively render children if expanded -->
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

// Receive props from parent component
const props = defineProps({
  employee: Object,
  levelColors: Object,
  visibleLayers: Set,
  highlightedEmployeeId: String
})

// Define emitted events
const emit = defineEmits(['toggle-hierarchy', 'employee-highlighted'])

// Track whether card is expanded
const expanded = ref(false)
const employeeCardRef = ref(null)

// Watch for highlighting changes to scroll into view
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

// Determine if this node should be visible based on its layer
const isVisible = computed(() => {
  return props.visibleLayers.has(props.employee.level)
})

// Toggle card expanded state
const toggleExpanded = () => {
  expanded.value = !expanded.value
}

// Emit toggle event to parent
const toggleHierarchy = () => {
  emit('toggle-hierarchy', props.employee)
}

// Format initials for avatar
const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Format large currency values for readability
const formatCurrency = (amount) => {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M'
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'K'
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

.location-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  flex-shrink: 0;
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