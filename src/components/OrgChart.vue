<template>
  <div class="org-chart-fullscreen">
    <div class="header-section">
      <div class="text-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Organizational Chart</h2>
        <p class="text-gray-600">Traditional hierarchy view with all employee metrics</p>
      </div>
      
      <!-- Search Bar -->
      <div class="flex justify-center mb-4">
        <div class="relative w-full max-w-md">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            @keyup.enter="searchAndHighlight"
            type="text"
            placeholder="Search employee by name..."
            class="w-full px-4 py-2 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Search Results -->
      <div v-if="searchResults.length > 0 && searchQuery" class="flex justify-center mb-4">
        <div class="bg-white rounded-lg border shadow-sm p-3 max-w-md w-full">
          <div class="text-sm text-gray-600 mb-2">Found {{ searchResults.length }} result(s):</div>
          <div class="space-y-1">
            <button
              v-for="result in searchResults.slice(0, 5)"
              :key="result.id"
              @click="selectEmployee(result)"
              class="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              <div class="font-medium text-gray-900">{{ result.name }}</div>
              <div class="text-xs text-gray-500">{{ result.jobTitle }} • {{ result.department }}</div>
            </button>
          </div>
          <div v-if="searchResults.length > 5" class="text-xs text-gray-500 mt-2">
            And {{ searchResults.length - 5 }} more...
          </div>
        </div>
      </div>
      
      <!-- Layer Controls -->
      <div class="flex justify-center mb-4">
        <div class="bg-white rounded-lg p-4 shadow border">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Visible Layers</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="level in availableLevels"
              :key="level"
              @click="toggleLayerVisibility(level)"
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                visibleLayers.has(level)
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
              :style="visibleLayers.has(level) ? { backgroundColor: levelColors[level] } : {}"
            >
              Layer {{ level }}
            </button>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            Showing {{ visibleLayers.size }} of {{ availableLevels.length }} layers
          </div>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="flex justify-center mb-4 space-x-4">
        <button 
          @click="expandAll" 
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Expand All
        </button>
        <button 
          @click="collapseAll" 
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Collapse All
        </button>
        <button 
          @click="resetView" 
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reset View
        </button>
        
        <!-- Zoom Controls -->
        <div class="flex items-center space-x-2 bg-white rounded-lg border px-3 py-2">
          <button 
            @click="zoomOut"
            class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            :disabled="zoomLevel <= 0.25"
          >
            −
          </button>
          <span class="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
          <button 
            @click="zoomIn"
            class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            :disabled="zoomLevel >= 2"
          >
            +
          </button>
          <button 
            @click="resetZoom"
            class="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors text-xs"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Scrollable Chart Container -->
    <div 
      ref="scrollContainer"
      class="chart-scroll-container-fullscreen bg-gray-50 border border-gray-200 shadow-lg"
      @scroll="handleScroll"
      @wheel="handleWheel"
    >
      <div 
        class="chart-content-horizontal"
        :style="{ 
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left'
        }"
      >
        <!-- Render the tree recursively starting from root -->
        <EmployeeNode 
          v-if="hierarchyTree && !loading"
          :employee="hierarchyTree"
          :level-colors="levelColors"
          :visible-layers="visibleLayers"
          :highlighted-employee-id="highlightedEmployeeId"
          @toggle-hierarchy="handleHierarchyToggle"
          @employee-highlighted="handleEmployeeHighlighted"
        />
      </div>

      <!-- Floating Zoom Controls -->
      <div class="floating-zoom-controls">
        <button 
          @click="zoomIn"
          class="zoom-btn zoom-in-btn"
          :disabled="zoomLevel >= 2"
          title="Zoom In"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
          </svg>
        </button>
        <button 
          @click="zoomOut"
          class="zoom-btn zoom-out-btn"
          :disabled="zoomLevel <= 0.25"
          title="Zoom Out"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"/>
          </svg>
        </button>
        <div class="zoom-level-display">
          {{ Math.round(zoomLevel * 100) }}%
        </div>
      </div>
    </div>

    <!-- Performance Info -->
    <div class="mt-4 text-center text-xs text-gray-500">
      Total employees: {{ allEmployees.length }} | Zoom: {{ Math.round(zoomLevel * 100) }}%
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import EmployeeNode from './EmployeeNode.vue'

// Define props
const props = defineProps({
  employees: {
    type: Array,
    required: true
  }
})

// Reactive state
const scrollContainer = ref(null)
const allEmployees = ref([])
const employeeMap = ref(new Map())
const hierarchyTree = ref(null)
const loading = ref(true)
const visibleLayers = ref(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
const availableLevels = ref([])
const expandedNodes = ref(new Set())
const metricsCache = ref(new Map())
const scrollTop = ref(0)
const scrollLeft = ref(0)
const containerHeight = ref(window.innerHeight - 200)
const containerWidth = ref(0)
const zoomLevel = ref(1)
const searchQuery = ref('')
const searchResults = ref([])
const highlightedEmployeeId = ref(null)

// Level colors
const levelColors = {
  0: '#374151', // gray - virtual root
  1: '#EF4444', // red - C-level executives
  2: '#F59E0B', // orange - VPs/Directors  
  3: '#10B981', // green - Senior managers
  4: '#3B82F6', // blue - Managers
  5: '#8B5CF6', // purple - Team leads
  6: '#06B6D4', // cyan - Senior ICs
  7: '#EC4899', // pink - Mid-level ICs
  8: '#84CC16', // lime - Junior ICs
  9: '#6366F1', // indigo - Entry level
  10: '#14B8A6' // teal - Interns/contractors
}

// Watch for employee changes
import { watch } from 'vue'
watch(() => props.employees, () => {
  buildOrgChart()
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  buildOrgChart()
  updateContainerSize()
  window.addEventListener('resize', updateContainerSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerSize)
})

// Methods
const buildOrgChart = () => {
  if (!props.employees || props.employees.length === 0) return

  console.time('Building org chart')
  
  // Step 1: Build employee map and hierarchy
  buildHierarchy()
  
  // Step 2: Calculate all metrics efficiently
  calculateAllMetrics()
  
  loading.value = false
  console.timeEnd('Building org chart')
}

const buildHierarchy = () => {
  employeeMap.value.clear()
  allEmployees.value = []
  
  // Create employee objects with optimized structure
  props.employees.forEach(emp => {
    const employee = {
      ...emp,
      children: [],
      parent: null,
      isExpanded: expandedNodes.value.has(emp.id),
      isVisible: true,
      hasChildren: false,
      directReports: 0,
      descendantCount: 0,
      nonLeafDescendants: 0,
      metrics: {
        managerCount: 0,
        icCount: 0,
        managerCost: 0,
        icCost: 0,
        totalCost: 0,
        managementCostRatio: '0.00'
      }
    }
    
    employeeMap.value.set(emp.id, employee)
    allEmployees.value.push(employee)
  })

  // Build parent-child relationships
  const roots = []
  allEmployees.value.forEach(emp => {
    if (emp.managerId && employeeMap.value.has(emp.managerId)) {
      const manager = employeeMap.value.get(emp.managerId)
      manager.children.push(emp)
      emp.parent = manager
    } else {
      roots.push(emp)
    }
  })

  // Update hasChildren and directReports
  allEmployees.value.forEach(emp => {
    emp.hasChildren = emp.children.length > 0
    emp.directReports = emp.children.length
  })

  // Handle multiple roots with virtual root
  if (roots.length > 1) {
    hierarchyTree.value = {
      id: 'virtual-root',
      name: 'Organization',
      level: 0,
      department: 'Root',
      jobTitle: 'Root',
      location: '',
      children: roots,
      parent: null,
      isExpanded: true,
      isVisible: true,
      hasChildren: true,
      directReports: roots.length,
      descendantCount: 0,
      nonLeafDescendants: 0,
      metrics: {
        managerCount: 0,
        icCount: 0,
        managerCost: 0,
        icCost: 0,
        totalCost: 0,
        managementCostRatio: '0.00'
      }
    }
    
    roots.forEach(root => {
      root.parent = hierarchyTree.value
    })
    
    allEmployees.value.unshift(hierarchyTree.value)
    employeeMap.value.set('virtual-root', hierarchyTree.value)
  } else if (roots.length === 1) {
    hierarchyTree.value = roots[0]
  }

  // Calculate available levels
  availableLevels.value = [...new Set(allEmployees.value.map(emp => emp.level))].sort((a, b) => a - b)
  
  // Debug: Log level distribution
  console.log('Available levels:', availableLevels.value)
  const levelCounts = {}
  allEmployees.value.forEach(emp => {
    levelCounts[emp.level] = (levelCounts[emp.level] || 0) + 1
  })
  console.log('Level distribution:', levelCounts)
  
  // Debug: Check for level 9 employees with children
  const level9WithChildren = allEmployees.value.filter(emp => emp.level === 9 && emp.children.length > 0)
  console.log('Level 9 employees with children:', level9WithChildren.length)
  if (level9WithChildren.length > 0) {
    console.log('Sample level 9 manager:', level9WithChildren[0])
    console.log('Their children levels:', level9WithChildren[0].children.map(child => child.level))
  }
}

const calculateAllMetrics = () => {
  console.time('Calculating metrics')
  
  // Clear cache
  metricsCache.value.clear()
  
  // Calculate metrics bottom-up for efficiency
  const calculateMetricsRecursive = (employee) => {
    if (metricsCache.value.has(employee.id)) {
      return metricsCache.value.get(employee.id)
    }
    
    let totalDescendants = 0
    let nonLeafDescendants = 0
    let managerCount = 0
    let icCount = 0
    let managerCost = 0
    let icCost = 0
    let totalCost = 0
    
    // Process children first (bottom-up)
    employee.children.forEach(child => {
      const childMetrics = calculateMetricsRecursive(child)
      
      // Add child's descendants to our count
      totalDescendants += 1 + childMetrics.descendantCount
      
      // Add child's costs
      managerCost += childMetrics.managerCost
      icCost += childMetrics.icCost
      totalCost += childMetrics.totalCost
      
      // Count managers vs ICs
      if (child.hasChildren) {
        managerCount += 1 + childMetrics.managerCount
        nonLeafDescendants += 1 + childMetrics.nonLeafDescendants
        managerCost += child.salary || 0
      } else {
        icCount += 1 + childMetrics.icCount
        icCost += child.salary || 0
      }
      
      totalCost += child.salary || 0
    })
    
    const managementCostRatio = totalCost > 0 ? (icCost / totalCost).toFixed(2) : '0.00'
    
    const metrics = {
      descendantCount: totalDescendants,
      nonLeafDescendants,
      managerCount,
      icCount,
      managerCost,
      icCost,
      totalCost,
      managementCostRatio
    }
    
    // Update employee object
    employee.descendantCount = totalDescendants
    employee.nonLeafDescendants = nonLeafDescendants
    employee.metrics = metrics
    
    metricsCache.value.set(employee.id, metrics)
    return metrics
  }
  
  // Start from root
  if (hierarchyTree.value) {
    calculateMetricsRecursive(hierarchyTree.value)
  }
  
  console.timeEnd('Calculating metrics')
}

const toggleLayerVisibility = (level) => {
  if (visibleLayers.value.has(level)) {
    visibleLayers.value.delete(level)
  } else {
    visibleLayers.value.add(level)
  }
  visibleLayers.value = new Set(visibleLayers.value)
}

const handleHierarchyToggle = (employee) => {
  employee.isExpanded = !employee.isExpanded
  
  if (employee.isExpanded) {
    expandedNodes.value.add(employee.id)
  } else {
    expandedNodes.value.delete(employee.id)
  }
}

const expandAll = () => {
  allEmployees.value.forEach(emp => {
    if (emp.hasChildren) {
      emp.isExpanded = true
      expandedNodes.value.add(emp.id)
    }
  })
}

const collapseAll = () => {
  allEmployees.value.forEach(emp => {
    if (emp.level > 1) {
      emp.isExpanded = false
      expandedNodes.value.delete(emp.id)
    }
  })
}

const resetView = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
    scrollContainer.value.scrollLeft = 0
  }
  zoomLevel.value = 1
}

const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop
  scrollLeft.value = event.target.scrollLeft
}

const updateContainerSize = () => {
  if (scrollContainer.value) {
    containerWidth.value = scrollContainer.value.clientWidth
    containerHeight.value = scrollContainer.value.clientHeight
  }
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

const zoomOut = () => {
  zoomLevel.value -= 0.25
}

const zoomIn = () => {
  zoomLevel.value += 0.25
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const handleWheel = (event) => {
  // Check if Ctrl key is pressed for zoom
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.25, Math.min(2, zoomLevel.value + delta))
    zoomLevel.value = newZoom
  }
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  searchResults.value = allEmployees.value.filter(emp => 
    emp.name && emp.name.toLowerCase().includes(query)
  ).slice(0, 10) // Limit to 10 results for performance
}

const searchAndHighlight = () => {
  if (searchResults.value.length > 0) {
    selectEmployee(searchResults.value[0])
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  highlightedEmployeeId.value = null
}

const selectEmployee = (employee) => {
  // Clear previous highlight
  highlightedEmployeeId.value = null
  
  // Expand path to the selected employee
  expandPathToEmployee(employee)
  
  // Clear search
  searchQuery.value = ''
  searchResults.value = []
  
  // Highlight the employee after a short delay to allow for DOM updates
  setTimeout(() => {
    highlightedEmployeeId.value = employee.id
  }, 100)
}

const expandPathToEmployee = (employee) => {
  // Get the path from root to this employee
  const path = []
  let current = employee
  
  while (current && current.parent) {
    path.unshift(current.parent)
    current = current.parent
  }
  
  // Expand all nodes in the path
  path.forEach(node => {
    if (node.hasChildren) {
      node.isExpanded = true
      expandedNodes.value.add(node.id)
    }
  })
}

const handleEmployeeHighlighted = (eventData) => {
  if (!scrollContainer.value || !eventData.position) return
  
  const container = scrollContainer.value
  const containerRect = container.getBoundingClientRect()
  
  // Calculate the center position of the container
  const containerCenterX = containerRect.width / 2
  const containerCenterY = containerRect.height / 2
  
  // Calculate where we want to scroll to center the employee
  const targetScrollX = eventData.position.x - containerCenterX + (eventData.position.width / 2)
  const targetScrollY = eventData.position.y - containerCenterY + (eventData.position.height / 2)
  
  // Ensure we don't scroll beyond the boundaries
  const maxScrollX = container.scrollWidth - container.clientWidth
  const maxScrollY = container.scrollHeight - container.clientHeight
  
  const finalScrollX = Math.max(0, Math.min(targetScrollX, maxScrollX))
  const finalScrollY = Math.max(0, Math.min(targetScrollY, maxScrollY))
  
  // Smooth scroll to the position
  container.scrollTo({
    left: finalScrollX,
    top: finalScrollY,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.org-chart-fullscreen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.header-section {
  padding: 20px;
  background: #f9fafb;
  flex-shrink: 0;
}

.chart-scroll-container-fullscreen {
  width: 100%;
  flex: 1;
  overflow: auto;
  position: relative;
}

.chart-content-horizontal {
  min-width: 100vw;
  width: max-content;
  padding: 2rem;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  transition: transform 0.2s ease-out;
}

.connections-svg {
  z-index: 1;
}

.employee-card {
  position: absolute;
  width: 280px;
  min-height: 380px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
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

.employee-info {
  text-align: center;
}

.employee-name {
  font-size: 16px;
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

.metrics {
  margin-top: 12px;
  text-align: left;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-size: 11px;
}

.metric-label {
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  color: #1f2937;
  font-weight: 600;
}

.connection-count {
  background-color: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  margin-top: 8px;
  display: inline-block;
}

.floating-zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.zoom-btn {
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  color: #374151;
}

.zoom-btn:hover:not(:disabled) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f3f4f6;
  color: #9ca3af;
}

.zoom-level-display {
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  padding: 6px 12px;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 50px;
  text-align: center;
}
</style> 