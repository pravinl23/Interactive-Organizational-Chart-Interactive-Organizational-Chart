<template>
  <div class="org-chart-fullscreen">
    <!-- Floating Vertical Toolbar -->
    <FloatingToolbar
      :search-expanded="searchExpanded"
      :filters-expanded="filtersExpanded"
      :controls-expanded="controlsExpanded"
      :zoom-expanded="zoomExpanded"
      :stats-expanded="statsExpanded"
      :charts-expanded="chartsExpanded"
      @toggle-section="toggleSection"
    />

    <!-- Centralized Panel -->
    <ToolbarPanel
      :search-expanded="searchExpanded"
      :filters-expanded="filtersExpanded"
      :controls-expanded="controlsExpanded"
      :zoom-expanded="zoomExpanded"
      :stats-expanded="statsExpanded"
      :charts-expanded="chartsExpanded"
      :search-query="searchQuery"
      :search-results="searchResults"
      :available-levels="availableLevels"
      :visible-layers="visibleLayers"
      :level-colors="levelColors"
      :is-expand-all-disabled="isExpandAllDisabled"
      :zoom-level="zoomLevel"
      :real-employee-count="realEmployeeCount"
      :current-view="currentView"
      @close-all-panels="closeAllPanels"
      @update-search-query="updateSearchQuery"
      @handle-search="handleSearchWithQuery"
      @search-and-highlight="searchAndHighlight"
      @select-employee="selectEmployeeAndClearSearch"
      @toggle-layer-visibility="toggleLayerVisibility"
      @expand-all="expandAll"
      @collapse-all="collapseAll"
      @reset-view="() => resetView(scrollContainer)"
      @zoom-out="zoomOut"
      @zoom-in="zoomIn"
      @reset-zoom="resetZoom"
      @switch-to-chart="switchToChart"
    />

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
          @employee-highlighted="(eventData) => handleEmployeeHighlighted(eventData, scrollContainer)"
        />

        <!-- Analytics Chart Views -->
        <AnalyticsViews
          v-if="currentView !== 'orgchart'"
          :current-view="currentView"
          :all-employees="allEmployees"
          :level-colors="levelColors"
          :available-levels="availableLevels"
        />
      </div>
    </div>

    <!-- Keyboard Controls Tips -->
    <div v-if="currentView === 'orgchart'" class="keyboard-tips">
      <div class="tips-header">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Controls</span>
      </div>
      <div class="tips-content">
        <div class="tip-group">
          <div class="tip-label">Navigate</div>
          <div class="tip-keys">
            <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>
            <span class="tip-or">or</span>
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          </div>
        </div>
        <div class="tip-group">
          <div class="tip-label">Zoom</div>
          <div class="tip-keys">
            <kbd>+</kbd><kbd>-</kbd>
            <span class="tip-or">or</span>
            <kbd>Ctrl</kbd> + <kbd>Scroll</kbd>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import EmployeeNode from './EmployeeNode.vue'
import FloatingToolbar from './toolbar/FloatingToolbar.vue'
import ToolbarPanel from './toolbar/ToolbarPanel.vue'
import AnalyticsViews from './analytics/AnalyticsViews.vue'
import { useOrgChart } from '../composables/useOrgChart.js'
import { useToolbar } from '../composables/useToolbar.js'

// Define props
const props = defineProps({
  employees: {
    type: Array,
    required: true
  }
})

// Use composables
const {
  // State
  allEmployees,
  hierarchyTree,
  loading,
  visibleLayers,
  availableLevels,
  zoomLevel,
  searchResults,
  highlightedEmployeeId,
  levelColors,
  
  // Computed
  isExpandAllDisabled,
  realEmployeeCount,
  
  // Methods
  toggleLayerVisibility,
  handleHierarchyToggle,
  expandAll,
  collapseAll,
  resetView,
  handleScroll,
  updateContainerSize,
  zoomOut,
  zoomIn,
  resetZoom,
  handleWheel,
  handleKeyDown,
  handleSearch,
  searchAndHighlight,
  selectEmployee,
  handleEmployeeHighlighted
} = useOrgChart(props)

const {
  // State
  searchExpanded,
  filtersExpanded,
  controlsExpanded,
  zoomExpanded,
  statsExpanded,
  chartsExpanded,
  currentView,
  searchQuery,
  
  // Methods
  toggleSection,
  closeAllPanels,
  switchToChart,
  updateSearchQuery
} = useToolbar()

// Refs
const scrollContainer = ref(null)

// Lifecycle hooks
onMounted(() => {
  updateContainerSize(scrollContainer.value)
  window.addEventListener('resize', () => updateContainerSize(scrollContainer.value))
  window.addEventListener('keydown', (event) => handleKeyDown(event, scrollContainer.value))
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => updateContainerSize(scrollContainer.value))
  window.removeEventListener('keydown', (event) => handleKeyDown(event, scrollContainer.value))
})

// Create a wrapper for handleSearch that passes the searchQuery
const handleSearchWithQuery = () => {
  handleSearch(searchQuery.value)
}

// Create a wrapper for selectEmployee that also clears the search query
const selectEmployeeAndClearSearch = (employee) => {
  selectEmployee(employee)
  updateSearchQuery('')
}
</script>

<style scoped>
.org-chart-fullscreen {
  height: 100vh;
  position: relative;
  background: #f8fafc;
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

/* Keyboard Tips Panel */
.keyboard-tips {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px;
  z-index: 1000;
  font-size: 12px;
  max-width: 280px;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}

.tips-header svg {
  color: #3b82f6;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-label {
  font-weight: 500;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tip-keys {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.tip-or {
  color: #94a3b8;
  font-size: 10px;
  margin: 0 4px;
}

kbd {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  color: #1e293b;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  min-width: 20px;
  text-align: center;
  display: inline-block;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .keyboard-tips {
    bottom: 10px;
    right: 10px;
    padding: 12px;
    max-width: 240px;
  }
  
  .tip-keys {
    gap: 3px;
  }
  
  kbd {
    padding: 1px 4px;
    font-size: 9px;
    min-width: 18px;
  }
}
</style> 