import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

export function useOrgChart(props) {
  // Reactive state
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

  // Computed properties
  const isExpandAllDisabled = computed(() => visibleLayers.value.size > 5)
  const realEmployeeCount = computed(() => allEmployees.value.filter(emp => !emp.isVirtualRoot).length)

  // Watch for employee changes
  watch(() => props.employees, () => {
    buildOrgChart()
  }, { deep: true })

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

  const resetView = (scrollContainer) => {
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
      scrollContainer.scrollLeft = 0
    }
    zoomLevel.value = 1
  }

  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
    scrollLeft.value = event.target.scrollLeft
  }

  const updateContainerSize = (scrollContainer) => {
    if (scrollContainer) {
      containerWidth.value = scrollContainer.clientWidth
      containerHeight.value = scrollContainer.clientHeight
    }
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

  const handleKeyDown = (event, scrollContainer) => {
    // Only handle navigation keys when not typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return
    }
    
    if (!scrollContainer) return
    
    const panDistance = 100 // pixels to pan per key press
    const currentScrollLeft = scrollContainer.scrollLeft
    const currentScrollTop = scrollContainer.scrollTop
    
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
          scrollContainer.scrollWidth - scrollContainer.clientWidth,
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
          scrollContainer.scrollHeight - scrollContainer.clientHeight,
          currentScrollTop + panDistance
        )
        shouldPreventDefault = true
        break
      case '+':
      case '=': // Handle both + and = keys (since + requires shift)
        if (zoomLevel.value < 2) {
          zoomIn()
          shouldPreventDefault = true
        }
        break
      case '-':
      case '_': // Handle both - and _ keys (since _ requires shift)
        if (zoomLevel.value > 0.25) {
          zoomOut()
          shouldPreventDefault = true
        }
        break
    }
    
    if (shouldPreventDefault) {
      event.preventDefault()
      if (newScrollLeft !== currentScrollLeft || newScrollTop !== currentScrollTop) {
        scrollContainer.scrollTo({
          left: newScrollLeft,
          top: newScrollTop,
          behavior: 'smooth'
        })
      }
    }
  }

  const handleSearch = (query) => {
    if (!query || !query.trim()) {
      searchResults.value = []
      return
    }
    
    const searchQuery = query.toLowerCase().trim()
    searchResults.value = allEmployees.value.filter(emp => 
      emp.name && emp.name.toLowerCase().includes(searchQuery)
    ).slice(0, 10) // Limit to 10 results for performance
  }

  const searchAndHighlight = () => {
    if (searchResults.value.length > 0) {
      selectEmployee(searchResults.value[0])
    }
  }

  const clearSearch = () => {
    searchResults.value = []
    highlightedEmployeeId.value = null
  }

  const selectEmployee = (employee) => {
    // Clear previous highlight
    highlightedEmployeeId.value = null
    
    // Expand path to the selected employee
    expandPathToEmployee(employee)
    
    // Clear search results
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

  const handleEmployeeHighlighted = (eventData, scrollContainer) => {
    if (!scrollContainer || !eventData.position) return
    
    const container = scrollContainer
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

  // Initialize
  onMounted(() => {
    buildOrgChart()
  })

  return {
    // State
    allEmployees,
    employeeMap,
    hierarchyTree,
    loading,
    visibleLayers,
    availableLevels,
    expandedNodes,
    metricsCache,
    scrollTop,
    scrollLeft,
    containerHeight,
    containerWidth,
    zoomLevel,
    searchResults,
    highlightedEmployeeId,
    levelColors,
    
    // Computed
    isExpandAllDisabled,
    realEmployeeCount,
    
    // Methods
    buildOrgChart,
    buildHierarchy,
    calculateAllMetrics,
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
    clearSearch,
    selectEmployee,
    expandPathToEmployee,
    handleEmployeeHighlighted
  }
} 