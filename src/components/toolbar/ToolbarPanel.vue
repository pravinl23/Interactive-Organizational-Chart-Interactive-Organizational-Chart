<template>
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
          :value="searchQuery"
          @input="updateSearchQuery"
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
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  searchExpanded: Boolean,
  filtersExpanded: Boolean,
  controlsExpanded: Boolean,
  zoomExpanded: Boolean,
  statsExpanded: Boolean,
  chartsExpanded: Boolean,
  searchQuery: String,
  searchResults: Array,
  availableLevels: Array,
  visibleLayers: Set,
  levelColors: Object,
  isExpandAllDisabled: Boolean,
  zoomLevel: Number,
  realEmployeeCount: Number,
  currentView: String
})

// Emits
const emit = defineEmits([
  'close-all-panels',
  'update-search-query',
  'handle-search',
  'search-and-highlight',
  'select-employee',
  'toggle-layer-visibility',
  'expand-all',
  'collapse-all',
  'reset-view',
  'zoom-out',
  'zoom-in',
  'reset-zoom',
  'switch-to-chart'
])

// Computed properties
const anyPanelExpanded = computed(() => {
  return props.searchExpanded || props.filtersExpanded || props.controlsExpanded || 
         props.zoomExpanded || props.statsExpanded || props.chartsExpanded
})

const currentPanelTitle = computed(() => {
  if (props.searchExpanded) return 'Search Employees'
  if (props.filtersExpanded) return 'Layer Filters'
  if (props.controlsExpanded) return 'Chart Controls'
  if (props.zoomExpanded) return 'Zoom Controls'
  if (props.statsExpanded) return 'Statistics'
  if (props.chartsExpanded) return 'Analytics Views'
  return ''
})

// Methods
const closeAllPanels = () => {
  emit('close-all-panels')
}

const updateSearchQuery = (event) => {
  emit('update-search-query', event.target.value)
  emit('handle-search')
}

const searchAndHighlight = () => {
  emit('search-and-highlight')
}

const selectEmployee = (employee) => {
  emit('select-employee', employee)
}

const toggleLayerVisibility = (level) => {
  emit('toggle-layer-visibility', level)
}

const expandAll = () => {
  emit('expand-all')
}

const collapseAll = () => {
  emit('collapse-all')
}

const resetView = () => {
  emit('reset-view')
}

const zoomOut = () => {
  emit('zoom-out')
}

const zoomIn = () => {
  emit('zoom-in')
}

const resetZoom = () => {
  emit('reset-zoom')
}

const switchToChart = (view) => {
  emit('switch-to-chart', view)
}
</script>

<style scoped>
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
  display: flex;
  align-items: center;
}

.chart-btn:hover {
  background-color: #f8fafc;
}

.chart-btn.active {
  background-color: #3b82f6;
  color: white;
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