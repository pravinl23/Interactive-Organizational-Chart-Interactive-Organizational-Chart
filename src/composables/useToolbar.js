import { ref, computed } from 'vue'

export function useToolbar() {
  // Toolbar section states
  const searchExpanded = ref(false)
  const filtersExpanded = ref(false)
  const controlsExpanded = ref(false)
  const zoomExpanded = ref(false)
  const statsExpanded = ref(false)
  const chartsExpanded = ref(false)
  const currentView = ref('orgchart')
  const searchQuery = ref('')

  // Computed properties
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

  // Methods
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

  const updateSearchQuery = (value) => {
    searchQuery.value = value
  }

  return {
    // State
    searchExpanded,
    filtersExpanded,
    controlsExpanded,
    zoomExpanded,
    statsExpanded,
    chartsExpanded,
    currentView,
    searchQuery,
    
    // Computed
    anyPanelExpanded,
    currentPanelTitle,
    
    // Methods
    toggleSection,
    closeAllPanels,
    switchToChart,
    updateSearchQuery
  }
} 