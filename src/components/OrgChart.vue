<template>
  <div class="org-chart-fullscreen">
    <!-- Floating Vertical Toolbar -->
    <div class="floating-toolbar">
      <!-- Search -->
      <div class="toolbar-item" :class="{ 'active': searchExpanded }">
        <button @click="toggleSection('search')" class="toolbar-btn" title="Search">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="toolbar-item" :class="{ 'active': filtersExpanded }">
        <button @click="toggleSection('filters')" class="toolbar-btn" title="Filters">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
        </button>
      </div>

      <!-- Controls -->
      <div class="toolbar-item" :class="{ 'active': controlsExpanded }">
        <button @click="toggleSection('controls')" class="toolbar-btn" title="Controls">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
          </svg>
        </button>
      </div>

      <!-- Zoom -->
      <div class="toolbar-item" :class="{ 'active': zoomExpanded }">
        <button @click="toggleSection('zoom')" class="toolbar-btn" title="Zoom">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
          </svg>
        </button>
      </div>

      <!-- Statistics -->
      <div class="toolbar-item" :class="{ 'active': statsExpanded }">
        <button @click="toggleSection('stats')" class="toolbar-btn" title="Statistics">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </button>
      </div>

      <!-- Chart Views -->
      <div class="toolbar-item" :class="{ 'active': chartsExpanded }">
        <button @click="toggleSection('charts')" class="toolbar-btn" title="Chart Views">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Centralized Panel Backdrop -->
    <div 
      v-if="anyPanelExpanded" 
      class="panel-backdrop"
      @click="closeAllPanels"
    ></div>

    <!-- Centralized Panel Container -->
    <div v-if="anyPanelExpanded" class="toolbar-panel">
      <div class="panel-header">
        <h3>{{ currentPanelTitle }}</h3>
        <button @click="closeAllPanels" class="close-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Search Panel Content -->
      <div v-if="searchExpanded" class="panel-content">
        <div class="search-container">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            @keyup.enter="searchAndHighlight"
            type="text"
            placeholder="Search by name..."
            class="search-input"
          />
        </div>
        
        <div v-if="searchResults.length > 0 && searchQuery" class="search-results">
          <div class="search-results-header">{{ searchResults.length }} result(s)</div>
          <div class="search-results-list">
            <button
              v-for="result in searchResults.slice(0, 5)"
              :key="result.id"
              @click="selectEmployee(result)"
              class="search-result-item"
            >
              <div class="search-result-name">{{ result.name }}</div>
              <div class="search-result-details">{{ result.jobTitle }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Panel Content -->
      <div v-if="filtersExpanded" class="panel-content">
        <div class="layer-buttons">
          <button
            v-for="level in availableLevels"
            :key="level"
            @click="toggleLayerVisibility(level)"
            :class="[
              'layer-btn',
              visibleLayers.has(level) ? 'layer-btn-active' : 'layer-btn-inactive'
            ]"
            :style="visibleLayers.has(level) ? { backgroundColor: levelColors[level], borderColor: levelColors[level] } : {}"
          >
            {{ level }}
          </button>
        </div>
        
        <div class="layer-info">
          {{ visibleLayers.size }}/{{ availableLevels.length }} layers visible
        </div>
      </div>

      <!-- Controls Panel Content -->
      <div v-if="controlsExpanded" class="panel-content">
        <div class="control-buttons">
          <button 
            @click="expandAll" 
            class="control-btn control-btn-primary" 
            :disabled="isExpandAllDisabled"
            :title="isExpandAllDisabled ? 'Reduce visible layers to 5 or fewer to use Expand All' : 'Expand all nodes in the chart'"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {{ isExpandAllDisabled ? 'Expand All (Disabled)' : 'Expand All' }}
          </button>
          <button @click="collapseAll" class="control-btn control-btn-secondary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
            Collapse All
          </button>
          <button @click="resetView" class="control-btn control-btn-outline">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Reset View
          </button>
        </div>
      </div>

      <!-- Zoom Panel Content -->
      <div v-if="zoomExpanded" class="panel-content">
        <div class="zoom-controls">
          <button 
            @click="zoomOut"
            class="zoom-btn"
            :disabled="zoomLevel <= 0.25"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>
          <div class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</div>
          <button 
            @click="zoomIn"
            class="zoom-btn"
            :disabled="zoomLevel >= 2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </button>
        </div>
        <button @click="resetZoom" class="zoom-reset-btn">
          Reset to 100%
        </button>
      </div>

      <!-- Statistics Panel Content -->
      <div v-if="statsExpanded" class="panel-content">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Total Employees</span>
            <span class="stat-value">{{ realEmployeeCount.toLocaleString() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Visible Layers</span>
            <span class="stat-value">{{ visibleLayers.size }}/{{ availableLevels.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Current Zoom</span>
            <span class="stat-value">{{ Math.round(zoomLevel * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- Charts Panel Content -->
      <div v-if="chartsExpanded" class="panel-content">
        <div class="chart-categories">
          <!-- Hierarchy Chart -->
          <div class="chart-category">
            <h4 class="category-title">Hierarchy Chart</h4>
            <button @click="switchToChart('orgchart')" class="chart-btn" :class="{ 'active': currentView === 'orgchart' }">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Org Chart
            </button>
          </div>

          <!-- Organizational Overview -->
          <div class="chart-category">
            <h4 class="category-title">Organizational Overview</h4>
            <button @click="switchToChart('proportion')" class="chart-btn" :class="{ 'active': currentView === 'proportion' }">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
              </svg>
              Proportion Chart
            </button>
          </div>

          <!-- Hierarchy & Layers -->
          <div class="chart-category">
            <h4 class="category-title">Hierarchy & Layers</h4>
            <button @click="switchToChart('heatmap')" class="chart-btn" :class="{ 'active': currentView === 'heatmap' }">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              Headcount Heatmap
            </button>
            <button @click="switchToChart('pyramid')" class="chart-btn" :class="{ 'active': currentView === 'pyramid' }">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Pyramid Chart
            </button>
          </div>

          <!-- Cost Analysis -->
          <div class="chart-category">
            <h4 class="category-title">Cost Analysis</h4>
            <button @click="switchToChart('cost-distribution')" class="chart-btn" :class="{ 'active': currentView === 'cost-distribution' }">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
              Cost Distribution
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chart Area (Full Screen) -->
    <div class="chart-scroll-container-fullscreen" 
         ref="scrollContainer"
         @scroll="handleScroll"
         @wheel="handleWheel">
      <div 
        class="chart-content-horizontal"
        :class="{ 'analytics-mode': currentView !== 'orgchart' }"
        :style="{ 
          transform: currentView === 'orgchart' ? `scale(${zoomLevel})` : 'none',
          transformOrigin: 'top left'
        }"
      >
        <!-- Org Chart View -->
        <EmployeeNode 
          v-if="hierarchyTree && !loading && currentView === 'orgchart'"
          :employee="hierarchyTree"
          :level-colors="levelColors"
          :visible-layers="visibleLayers"
          :highlighted-employee-id="highlightedEmployeeId"
          @toggle-hierarchy="handleHierarchyToggle"
          @employee-highlighted="handleEmployeeHighlighted"
        />

        <!-- Analytics Chart Views -->
        <div v-if="currentView !== 'orgchart'" class="analytics-container">
          <!-- Proportion Chart View -->
          <div v-if="currentView === 'proportion'" class="chart-view">
            <h2 class="chart-title">Headcount Proportion by Department</h2>
            <p class="chart-description">Distribution of employees across different areas</p>
            <div class="proportion-chart">
              <div class="pie-chart">
                <svg viewBox="0 0 200 200" class="pie-svg">
                  <circle
                    v-for="(segment, index) in pieSegments"
                    :key="index"
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    :stroke="segment.color"
                    stroke-width="40"
                    :stroke-dasharray="segment.dashArray"
                    :stroke-dashoffset="segment.dashOffset"
                    :transform="segment.transform"
                  />
                </svg>
              </div>
              <div class="pie-legend">
                <div v-for="dept in departmentData" :key="dept.name" class="legend-item">
                  <div class="legend-color" :style="{ backgroundColor: dept.color }"></div>
                  <span class="legend-label">{{ dept.name }} ({{ dept.count }})</span>
                </div>
              </div>
            </div>
            
            <!-- Summary statistics -->
            <div class="summary-stats">
              <h3 class="summary-title">Summary Statistics</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">{{ departmentData.length }}</div>
                  <div class="stat-label">Total Departments</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ realEmployeeCount.toLocaleString() }}</div>
                  <div class="stat-label">Total Employees</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ Math.round(realEmployeeCount / departmentData.length) }}</div>
                  <div class="stat-label">Avg per Department</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pyramid Chart View -->
          <div v-if="currentView === 'pyramid'" class="chart-view">
            <h2 class="chart-title">Organizational Pyramid</h2>
            <p class="chart-description">Headcount distribution by organizational level</p>
            <div class="pyramid-chart">
              <div 
                v-for="level in pyramidData" 
                :key="level.level"
                class="pyramid-level"
                :style="{ 
                  width: (level.count / maxLevelCount * 100) + '%',
                  backgroundColor: levelColors[level.level] + '80'
                }"
              >
                <div class="pyramid-label">Level {{ level.level }}</div>
                <div class="pyramid-count">{{ level.count }}</div>
              </div>
            </div>
          </div>

          <!-- Cost Distribution View -->
          <div v-if="currentView === 'cost-distribution'" class="chart-view">
            <h2 class="chart-title">Cost Distribution by Department</h2>
            <p class="chart-description">Total workforce cost across departments</p>
            <div class="cost-chart">
              <div 
                v-for="dept in costData" 
                :key="dept.name"
                class="cost-bar"
              >
                <div class="cost-label">{{ dept.name }}</div>
                <div class="cost-bar-container">
                  <div 
                    class="cost-bar-fill"
                    :style="{ 
                      width: (dept.cost / maxCost * 100) + '%',
                      backgroundColor: dept.color
                    }"
                  ></div>
                  <span class="cost-amount">${{ formatCurrency(dept.cost) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Heatmap View -->
          <div v-if="currentView === 'heatmap'" class="chart-view">
            <h2 class="chart-title">Headcount Heatmap</h2>
            <p class="chart-description">Employee distribution across levels and departments</p>
            <div class="heatmap-container">
              <div class="heatmap-grid">
                <div class="heatmap-header">
                  <div class="heatmap-cell header-cell"></div>
                  <div v-for="dept in uniqueDepartments" :key="dept" class="heatmap-cell header-cell">
                    {{ dept }}
                  </div>
                </div>
                <div v-for="level in availableLevels" :key="level" class="heatmap-row">
                  <div class="heatmap-cell level-cell">Level {{ level }}</div>
                  <div 
                    v-for="dept in uniqueDepartments" 
                    :key="dept"
                    class="heatmap-cell data-cell"
                    :style="{ 
                      backgroundColor: getHeatmapColor(getHeatmapValue(level, dept)),
                      color: getHeatmapValue(level, dept) > 50 ? 'white' : 'black'
                    }"
                  >
                    {{ getHeatmapValue(level, dept) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

// Sidebar section states
const searchExpanded = ref(false)
const filtersExpanded = ref(false)
const controlsExpanded = ref(false)
const zoomExpanded = ref(false)
const statsExpanded = ref(false)
const chartsExpanded = ref(false)
const currentView = ref('orgchart')

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

// Computed properties
const isExpandAllDisabled = computed(() => visibleLayers.value.size > 5)
const realEmployeeCount = computed(() => allEmployees.value.filter(emp => !emp.isVirtualRoot).length)

// Centralized panel computed properties
const anyPanelExpanded = computed(() => {
  return searchExpanded.value || filtersExpanded.value || controlsExpanded.value || 
         zoomExpanded.value || statsExpanded.value || chartsExpanded.value
})

const currentPanelTitle = computed(() => {
  if (searchExpanded.value) return 'Search Employees'
  if (filtersExpanded.value) return 'Layer Filters'
  if (controlsExpanded.value) return 'Chart Controls'
  if (zoomExpanded.value) return 'Zoom Controls'
  if (statsExpanded.value) return 'Statistics'
  if (chartsExpanded.value) return 'Analytics Views'
  return ''
})

// Analytics data computed properties
const departmentData = computed(() => {
  const deptCounts = {}
  const realEmps = allEmployees.value.filter(emp => !emp.isVirtualRoot)
  
  realEmps.forEach(emp => {
    deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1
  })
  
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']
  
  return Object.entries(deptCounts)
    .map(([name, count], index) => ({
      name,
      count,
      percentage: (count / realEmps.length * 100).toFixed(1),
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.count - a.count)
})

const spanData = computed(() => {
  const spans = {}
  const managers = allEmployees.value.filter(emp => emp.hasChildren && !emp.isVirtualRoot)
  
  managers.forEach(emp => {
    const span = emp.directReports
    let range
    if (span === 1) range = '1:1'
    else if (span <= 3) range = '1:2-3'
    else if (span <= 5) range = '1:4-5'
    else if (span <= 7) range = '1:6-7'
    else if (span <= 10) range = '1:8-10'
    else range = '1:10+'
    
    if (!spans[range]) {
      spans[range] = { count: 0, level: emp.level }
    }
    spans[range].count++
  })
  
  return Object.entries(spans).map(([range, data]) => ({
    range,
    count: data.count,
    level: data.level
  }))
})

const maxSpanCount = computed(() => Math.max(...spanData.value.map(s => s.count), 1))

const pyramidData = computed(() => {
  const levels = {}
  const realEmps = allEmployees.value.filter(emp => !emp.isVirtualRoot)
  
  realEmps.forEach(emp => {
    levels[emp.level] = (levels[emp.level] || 0) + 1
  })
  
  return Object.entries(levels)
    .map(([level, count]) => ({ level: parseInt(level), count }))
    .sort((a, b) => a.level - b.level)
})

const maxLevelCount = computed(() => Math.max(...pyramidData.value.map(l => l.count), 1))

const costData = computed(() => {
  const deptCosts = {}
  const realEmps = allEmployees.value.filter(emp => !emp.isVirtualRoot)
  
  realEmps.forEach(emp => {
    const salary = emp.salary || 0
    deptCosts[emp.department] = (deptCosts[emp.department] || 0) + salary
  })
  
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']
  
  return Object.entries(deptCosts)
    .map(([name, cost], index) => ({
      name,
      cost,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.cost - a.cost)
})

const maxCost = computed(() => Math.max(...costData.value.map(d => d.cost), 1))

const uniqueDepartments = computed(() => {
  return [...new Set(allEmployees.value.filter(emp => !emp.isVirtualRoot).map(emp => emp.department))]
    .sort()
    .slice(0, 10) // Limit for display
})

const pieSegments = computed(() => {
  let cumulativePercentage = 0
  const circumference = 2 * Math.PI * 80 // radius = 80
  
  return departmentData.value.map(dept => {
    const percentage = parseFloat(dept.percentage)
    const dashArray = `${(percentage / 100) * circumference} ${circumference}`
    const dashOffset = -cumulativePercentage / 100 * circumference
    
    cumulativePercentage += percentage
    
    return {
      color: dept.color,
      dashArray,
      dashOffset,
      transform: 'rotate(-90 100 100)'
    }
  })
})

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
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerSize)
  window.removeEventListener('keydown', handleKeyDown)
})

// Methods
const buildOrgChart = () => {
  if (!props.employees || props.employees.length === 0) return

  // Step 1: Build employee map and hierarchy
  buildHierarchy()
  
  // Step 2: Calculate all metrics efficiently
  calculateAllMetrics()
  
  loading.value = false
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
      isVirtualRoot: true,
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
    
    // Add virtual root to allEmployees for rendering, but mark it as virtual
    allEmployees.value.unshift(hierarchyTree.value)
    employeeMap.value.set('virtual-root', hierarchyTree.value)
  } else if (roots.length === 1) {
    hierarchyTree.value = roots[0]
  }

  // Calculate available levels
  availableLevels.value = [...new Set(allEmployees.value.map(emp => emp.level))].sort((a, b) => a - b)
}

const calculateAllMetrics = () => {
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
      // Always count 1 for the child + all their descendants
      totalDescendants += 1 + childMetrics.descendantCount
      
      // Add child's costs (skip virtual root costs)
      if (!child.isVirtualRoot) {
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
      }
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
  // Safety check: only allow expand all if 5 or fewer layers are visible
  if (visibleLayers.value.size > 5) {
    // Don't show alert since button is disabled and has tooltip
    return
  }
  
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

const handleKeyDown = (event) => {
  // Only handle navigation keys when not typing in an input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }
  
  if (!scrollContainer.value) return
  
  const panDistance = 100 // pixels to pan per key press
  const currentScrollLeft = scrollContainer.value.scrollLeft
  const currentScrollTop = scrollContainer.value.scrollTop
  
  let newScrollLeft = currentScrollLeft
  let newScrollTop = currentScrollTop
  let shouldPreventDefault = false
  
  switch (event.key.toLowerCase()) {
    case 'arrowleft':
    case 'a':
      newScrollLeft = Math.max(0, currentScrollLeft - panDistance)
      shouldPreventDefault = true
      break
    case 'arrowright':
    case 'd':
      newScrollLeft = Math.min(
        scrollContainer.value.scrollWidth - scrollContainer.value.clientWidth,
        currentScrollLeft + panDistance
      )
      shouldPreventDefault = true
      break
    case 'arrowup':
    case 'w':
      newScrollTop = Math.max(0, currentScrollTop - panDistance)
      shouldPreventDefault = true
      break
    case 'arrowdown':
    case 's':
      newScrollTop = Math.min(
        scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight,
        currentScrollTop + panDistance
      )
      shouldPreventDefault = true
      break
  }
  
  if (shouldPreventDefault) {
    event.preventDefault()
    scrollContainer.value.scrollTo({
      left: newScrollLeft,
      top: newScrollTop,
      behavior: 'smooth'
    })
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

const toggleSection = (section) => {
  // Check if the clicked section is already open
  let isCurrentlyOpen = false
  switch (section) {
    case 'search':
      isCurrentlyOpen = searchExpanded.value
      break
    case 'filters':
      isCurrentlyOpen = filtersExpanded.value
      break
    case 'controls':
      isCurrentlyOpen = controlsExpanded.value
      break
    case 'zoom':
      isCurrentlyOpen = zoomExpanded.value
      break
    case 'stats':
      isCurrentlyOpen = statsExpanded.value
      break
    case 'charts':
      isCurrentlyOpen = chartsExpanded.value
      break
  }
  
  // Close all sections first
  searchExpanded.value = false
  filtersExpanded.value = false
  controlsExpanded.value = false
  zoomExpanded.value = false
  statsExpanded.value = false
  chartsExpanded.value = false
  
  // If the section wasn't open, open it now
  if (!isCurrentlyOpen) {
    switch (section) {
      case 'search':
        searchExpanded.value = true
        break
      case 'filters':
        filtersExpanded.value = true
        break
      case 'controls':
        controlsExpanded.value = true
        break
      case 'zoom':
        zoomExpanded.value = true
        break
      case 'stats':
        statsExpanded.value = true
        break
      case 'charts':
        chartsExpanded.value = true
        break
    }
  }
}

const closeAllPanels = () => {
  searchExpanded.value = false
  filtersExpanded.value = false
  controlsExpanded.value = false
  zoomExpanded.value = false
  statsExpanded.value = false
  chartsExpanded.value = false
}

const switchToChart = (view) => {
  currentView.value = view
}

const getHeatmapValue = (level, department) => {
  const employees = allEmployees.value.filter(emp => 
    !emp.isVirtualRoot && emp.level === level && emp.department === department
  )
  return employees.length
}

const getHeatmapColor = (value) => {
  if (value === 0) return '#f8fafc'
  const intensity = Math.min(value / 100, 1) // Normalize to 0-1
  const opacity = 0.1 + (intensity * 0.9) // 10% to 100% opacity
  return `rgba(59, 130, 246, ${opacity})`
}

const getChartTitle = (view) => {
  const titles = {
    'avg-span': 'Average Span of Control',
    'cost-breakdown': 'Cost Breakdown Analysis'
  }
  return titles[view] || 'Analytics View'
}

const getChartDescription = (view) => {
  const descriptions = {
    'avg-span': 'Summary view of average span across departments',
    'cost-breakdown': 'Detailed breakdown of workforce costs by category'
  }
  return descriptions[view] || 'Advanced organizational analytics'
}
</script>

<style scoped>
.org-chart-fullscreen {
  height: 100vh;
  position: relative;
  background: #f8fafc;
}

.floating-toolbar {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  overflow: visible;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(-40%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%);
  }
}

.toolbar-item {
  position: relative;
}

.toolbar-btn {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
  border-radius: 12px;
  margin: 4px;
  position: relative;
  overflow: hidden;
}

.toolbar-btn::after {
  content: attr(title);
  position: absolute;
  left: 72px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1002;
}

.toolbar-btn:hover::after {
  opacity: 1;
  transform: translateY(-50%) translateX(8px);
}

.toolbar-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.toolbar-btn:hover::before {
  width: 100%;
  height: 100%;
}

.toolbar-btn:hover {
  color: #3b82f6;
  transform: scale(1.1);
}

.active .toolbar-btn {
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
  }
  100% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
}

.toolbar-panel {
  position: fixed;
  left: 100px;
  top: 50%;
  transform: translateY(-50%);
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  padding: 20px;
  z-index: 1001;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

/* Search Styles */
.search-container {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background-color: #fafbfc;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-results {
  background-color: #fafbfc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}

.search-results-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.search-results-list {
  max-height: 200px;
  overflow-y: auto;
}

.search-result-item {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: white;
}

.search-result-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 2px;
}

.search-result-details {
  font-size: 12px;
  color: #64748b;
}

/* Filter Styles */
.layer-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.layer-btn {
  padding: 8px 4px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  color: #64748b;
  text-align: center;
}

.layer-btn-active {
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.layer-btn-inactive:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.layer-info {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  padding: 8px 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

/* Control Button Styles */
.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.control-btn-primary {
  background-color: #3b82f6;
  color: white;
}

.control-btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.control-btn-primary:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.control-btn-primary:disabled:hover {
  background-color: #94a3b8;
  transform: none;
}

.control-btn-secondary {
  background-color: #64748b;
  color: white;
}

.control-btn-secondary:hover {
  background-color: #475569;
  transform: translateY(-1px);
}

.control-btn-outline {
  background-color: white;
  border-color: #e2e8f0;
  color: #64748b;
}

.control-btn-outline:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

/* Zoom Styles */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  background-color: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.zoom-btn {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover:not(:disabled) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: scale(1.05);
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8fafc;
}

.zoom-level {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  min-width: 60px;
  text-align: center;
}

.zoom-reset-btn {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.zoom-reset-btn:hover {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
}

/* Statistics Styles */
.stats {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

/* Main Chart Area */
.chart-scroll-container-fullscreen {
  width: 100vw;
  height: 100vh;
  overflow: auto;
  position: relative;
  background: #f8fafc;
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

.chart-content-horizontal.analytics-mode {
  width: 100%;
  min-width: 100%;
  height: auto;
  min-height: 100vh;
  padding: 0;
}

/* Employee Card Styles (preserved from original) */
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

/* Chart Views Styles */
.chart-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.chart-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
}

.chart-btn:hover {
  background-color: #f8fafc;
}

.chart-btn-primary {
  background-color: #3b82f6;
  color: white;
}

.chart-btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.chart-btn.active {
  background-color: #3b82f6;
  color: white;
}

/* Analytics Container Styles */
.analytics-container {
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  background: #f8fafc;
}

.chart-view {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.chart-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.chart-description {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 2rem;
}

/* Org Map Styles */
.orgmap-container {
  display: flex;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.orgmap-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-right: 2px solid;
  position: relative;
  transition: all 0.3s ease;
}

.orgmap-section:hover {
  transform: scale(1.02);
  z-index: 10;
}

.orgmap-section:last-child {
  border-right: none;
}

.orgmap-label {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
  padding: 0 8px;
}

.orgmap-count {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

/* Proportion Chart Styles */
.proportion-chart {
  display: flex;
  align-items: center;
  gap: 3rem;
  justify-content: center;
}

.pie-chart {
  width: 300px;
  height: 300px;
}

.pie-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-label {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

/* Span Chart Styles */
.span-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.span-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.span-label {
  width: 80px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.span-bar-container {
  flex: 1;
  height: 40px;
  background: #f1f5f9;
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
}

.span-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
}

.span-count {
  position: absolute;
  right: 12px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

/* Pyramid Chart Styles */
.pyramid-chart {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 2rem 0;
}

.pyramid-level {
  height: 50px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  transition: all 0.3s ease;
  border: 2px solid rgba(0, 0, 0, 0.1);
  gap: 12px;
}

.pyramid-level:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pyramid-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.pyramid-count {
  font-weight: 700;
  color: #1e293b;
  font-size: 16px;
}

/* Cost Chart Styles */
.cost-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cost-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cost-label {
  width: 200px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.cost-bar-container {
  flex: 1;
  height: 40px;
  background: #f1f5f9;
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
}

.cost-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.cost-amount {
  position: absolute;
  right: 12px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

/* Heatmap Styles */
.heatmap-container {
  overflow-x: auto;
}

.heatmap-grid {
  display: table;
  border-collapse: collapse;
  min-width: 100%;
}

.heatmap-header,
.heatmap-row {
  display: table-row;
}

.heatmap-cell {
  display: table-cell;
  padding: 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  min-width: 80px;
}

.header-cell {
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
  position: sticky;
  top: 0;
  z-index: 10;
}

.level-cell {
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
  position: sticky;
  left: 0;
  z-index: 5;
}

.data-cell {
  /* No transitions or hover effects - pure data display */
}

/* Coming Soon Styles */
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .proportion-chart {
    flex-direction: column;
    gap: 2rem;
  }
  
  .pie-chart {
    width: 250px;
    height: 250px;
  }
  
  .span-label,
  .cost-label {
    width: 120px;
    font-size: 12px;
  }
  
  .chart-view {
    padding: 1rem;
  }
  
  .analytics-container {
    padding: 1rem;
  }
}

/* Insights Section Styles */
.insights-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.insights-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.insight-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

.insight-header {
  padding: 1rem;
  color: white;
}

.insight-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.insight-content {
  padding: 1rem;
}

.insight-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.insight-stat:last-child {
  border-bottom: none;
}

.insight-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.insight-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}

/* Summary Statistics Styles */
.summary-stats {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.summary-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

/* Panel Backdrop */
.panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Panel Content */
.panel-content {
  /* No additional styling needed - content flows naturally */
}
</style> 