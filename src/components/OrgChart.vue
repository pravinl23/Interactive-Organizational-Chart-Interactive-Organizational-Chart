<template>
  <div class="org-chart-fullscreen">
    <div class="header-section">
      <div class="text-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Organizational Chart</h2>
        <p class="text-gray-600">Traditional hierarchy view with all employee metrics</p>
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
      </div>
    </div>

    <!-- Scrollable Chart Container with Virtualization -->
    <div 
      ref="scrollContainer"
      class="chart-scroll-container-fullscreen bg-gray-50 border border-gray-200 shadow-lg"
      @scroll="handleScroll"
    >
      <div class="chart-content" :style="{ width: chartWidth + 'px', height: chartHeight + 'px' }">
        <!-- SVG for connection lines (only visible ones) -->
        <svg 
          class="connections-svg" 
          :width="chartWidth" 
          :height="chartHeight"
          style="position: absolute; top: 0; left: 0; pointer-events: none;"
        >
          <g v-for="connection in visibleConnections" :key="connection.id">
            <path
              :d="connection.path"
              stroke="#cbd5e1"
              stroke-width="2"
              fill="none"
            />
          </g>
        </svg>

        <!-- Employee Cards (only visible ones) -->
        <div
          v-for="employee in visibleEmployeeCards"
          :key="employee.id"
          class="employee-card"
          :style="{
            left: employee.x + 'px',
            top: employee.y + 'px',
            backgroundColor: levelColors[employee.level] + '10'
          }"
          @click="toggleEmployee(employee)"
        >
          <!-- Avatar -->
          <div 
            class="avatar"
            :style="{ backgroundColor: levelColors[employee.level] }"
          >
            {{ getInitials(employee.name) }}
          </div>

          <!-- Employee Info -->
          <div class="employee-info">
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

            <!-- Expand/Collapse Indicator -->
            <div class="expand-indicator" v-if="employee.hasChildren">
              <span class="text-xs font-medium">
                {{ employee.isExpanded ? '▼' : '▶' }} 
                {{ employee.directReports }} direct reports
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Info -->
    <div class="mt-4 text-center text-xs text-gray-500">
      Showing {{ visibleEmployeeCards.length }} of {{ totalVisibleEmployees }} visible employees 
      ({{ allEmployees.length }} total) | Scroll: {{ Math.round(scrollTop) }}px
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrgChart',
  props: {
    employees: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      allEmployees: [],
      employeeMap: new Map(),
      hierarchyTree: null,
      connections: [],
      chartWidth: 0,
      chartHeight: 0,
      visibleLayers: new Set([1, 2, 3, 4, 5]),
      availableLevels: [],
      levelColors: {
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
      },
      cardWidth: 280,
      cardHeight: 380,
      levelSpacing: 420,
      nodeSpacing: 50,
      // Virtualization
      scrollTop: 0,
      scrollLeft: 0,
      containerHeight: window.innerHeight - 200, // Account for header section
      containerWidth: 0,
      renderBuffer: 200, // Extra pixels to render outside viewport
      // Performance optimization
      expandedNodes: new Set(),
      metricsCache: new Map()
    }
  },
  computed: {
    totalVisibleEmployees() {
      return this.allEmployees.filter(emp => 
        this.visibleLayers.has(emp.level) && emp.isVisible
      ).length
    },
    
    visibleEmployeeCards() {
      // Viewport culling for performance
      const viewportLeft = this.scrollLeft - this.renderBuffer
      const viewportRight = this.scrollLeft + this.containerWidth + this.renderBuffer
      const viewportTop = this.scrollTop - this.renderBuffer
      const viewportBottom = this.scrollTop + this.containerHeight + this.renderBuffer
      
      return this.allEmployees.filter(emp => {
        if (!this.visibleLayers.has(emp.level) || !emp.isVisible) return false
        
        return emp.x + this.cardWidth >= viewportLeft &&
               emp.x <= viewportRight &&
               emp.y + this.cardHeight >= viewportTop &&
               emp.y <= viewportBottom
      })
    },
    
    visibleConnections() {
      // Only render connections for visible cards
      const visibleIds = new Set(this.visibleEmployeeCards.map(emp => emp.id))
      return this.connections.filter(conn => 
        visibleIds.has(conn.sourceId) && visibleIds.has(conn.targetId)
      )
    }
  },
  watch: {
    employees: {
      handler() {
        this.buildOrgChart()
      },
      deep: true
    }
  },
  mounted() {
    this.buildOrgChart()
    this.updateContainerSize()
    window.addEventListener('resize', this.updateContainerSize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateContainerSize)
  },
  methods: {
    buildOrgChart() {
      if (!this.employees || this.employees.length === 0) return

      console.time('Building org chart')
      
      // Step 1: Build employee map and hierarchy
      this.buildHierarchy()
      
      // Step 2: Calculate all metrics efficiently
      this.calculateAllMetrics()
      
      // Step 3: Calculate positions using optimized algorithm
      this.calculateOptimizedPositions()
      
      // Step 4: Generate connections
      this.generateConnections()
      
      console.timeEnd('Building org chart')
    },

    buildHierarchy() {
      this.employeeMap.clear()
      this.allEmployees = []
      
      // Create employee objects with optimized structure
      this.employees.forEach(emp => {
        const employee = {
          ...emp,
          children: [],
          parent: null,
          isExpanded: this.expandedNodes.has(emp.id),
          isVisible: true,
          hasChildren: false,
          directReports: 0,
          descendantCount: 0,
          nonLeafDescendants: 0,
          x: 0,
          y: 0,
          metrics: {
            managerCount: 0,
            icCount: 0,
            managerCost: 0,
            icCost: 0,
            totalCost: 0,
            managementCostRatio: '0.00'
          }
        }
        
        this.employeeMap.set(emp.id, employee)
        this.allEmployees.push(employee)
      })

      // Build parent-child relationships
      const roots = []
      this.allEmployees.forEach(emp => {
        if (emp.managerId && this.employeeMap.has(emp.managerId)) {
          const manager = this.employeeMap.get(emp.managerId)
          manager.children.push(emp)
          emp.parent = manager
        } else {
          roots.push(emp)
        }
      })

      // Update hasChildren and directReports
      this.allEmployees.forEach(emp => {
        emp.hasChildren = emp.children.length > 0
        emp.directReports = emp.children.length
      })

      // Handle multiple roots with virtual root
      if (roots.length > 1) {
        this.hierarchyTree = {
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
          root.parent = this.hierarchyTree
        })
        
        this.allEmployees.unshift(this.hierarchyTree)
        this.employeeMap.set('virtual-root', this.hierarchyTree)
      } else if (roots.length === 1) {
        this.hierarchyTree = roots[0]
      }

      // Calculate available levels
      this.availableLevels = [...new Set(this.allEmployees.map(emp => emp.level))].sort((a, b) => a - b)
    },

    calculateAllMetrics() {
      console.time('Calculating metrics')
      
      // Clear cache
      this.metricsCache.clear()
      
      // Calculate metrics bottom-up for efficiency
      const calculateMetricsRecursive = (employee) => {
        if (this.metricsCache.has(employee.id)) {
          return this.metricsCache.get(employee.id)
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
        
        this.metricsCache.set(employee.id, metrics)
        return metrics
      }
      
      // Start from root
      if (this.hierarchyTree) {
        calculateMetricsRecursive(this.hierarchyTree)
      }
      
      console.timeEnd('Calculating metrics')
    },

    calculateOptimizedPositions() {
      console.time('Calculating positions')
      
      // Update visibility based on expansion state
      this.updateVisibility()
      
      // Use a tree-based positioning algorithm
      this.positionTreeNodes()
      
      console.timeEnd('Calculating positions')
    },

    positionTreeNodes() {
      if (!this.hierarchyTree) return

      // Reset positions
      this.allEmployees.forEach(emp => {
        emp.x = 0
        emp.y = 0
        emp.treeX = 0 // Tree-based X position
        emp.treeY = 0 // Tree-based Y position
      })

      // Calculate tree positions using a recursive approach
      let globalX = 0
      const levelY = new Map() // Track Y position for each level

      const positionNode = (node, level = 0) => {
        if (!node || !node.isVisible) return 0

        // Set Y position based on level
        const y = level * this.levelSpacing + 50
        node.y = y
        node.treeY = y

        // Initialize level tracking
        if (!levelY.has(level)) {
          levelY.set(level, 50)
        }

        let subtreeWidth = 0
        let childPositions = []

        // Position children first (post-order traversal)
        if (node.isExpanded && node.children && node.children.length > 0) {
          let childX = globalX
          
          node.children.forEach(child => {
            if (child.isVisible) {
              const childWidth = positionNode(child, level + 1)
              childPositions.push({
                child,
                x: childX + childWidth / 2,
                width: childWidth
              })
              childX += childWidth + this.nodeSpacing
              subtreeWidth += childWidth + this.nodeSpacing
            }
          })
          
          // Remove extra spacing
          if (subtreeWidth > 0) {
            subtreeWidth -= this.nodeSpacing
          }
        }

        // Position current node
        const nodeWidth = this.cardWidth
        
        if (childPositions.length > 0) {
          // Center parent over children
          const leftmostChild = childPositions[0].x - childPositions[0].width / 2
          const rightmostChild = childPositions[childPositions.length - 1].x + childPositions[childPositions.length - 1].width / 2
          const childrenCenter = (leftmostChild + rightmostChild) / 2
          node.x = childrenCenter - nodeWidth / 2
          node.treeX = node.x
        } else {
          // Leaf node - position at current global X
          node.x = globalX
          node.treeX = globalX
          globalX += nodeWidth + this.nodeSpacing
        }

        // Ensure minimum width for subtree
        const currentSubtreeWidth = Math.max(subtreeWidth, nodeWidth)
        
        return currentSubtreeWidth
      }

      // Start positioning from root
      const totalWidth = positionNode(this.hierarchyTree, 0)
      
      // Update chart dimensions
      this.chartWidth = Math.max(totalWidth + 100, window.innerWidth)
      this.chartHeight = this.availableLevels.length * this.levelSpacing + 100

      // Ensure no negative positions
      let minX = Math.min(...this.allEmployees.filter(emp => emp.isVisible).map(emp => emp.x))
      if (minX < 50) {
        const offset = 50 - minX
        this.allEmployees.forEach(emp => {
          if (emp.isVisible) {
            emp.x += offset
          }
        })
        this.chartWidth += offset
      }
    },

    updateVisibility() {
      // Reset visibility
      this.allEmployees.forEach(emp => {
        emp.isVisible = false
      })
      
      // BFS to mark visible nodes
      const queue = [this.hierarchyTree]
      
      while (queue.length > 0) {
        const current = queue.shift()
        if (!current) continue
        
        current.isVisible = true
        
        if (current.isExpanded && current.children) {
          current.children.forEach(child => {
            queue.push(child)
          })
        }
      }
    },

    generateConnections() {
      this.connections = []
      
      this.allEmployees.forEach(emp => {
        if (emp.isVisible && emp.isExpanded && emp.children) {
          emp.children.forEach(child => {
            if (child.isVisible) {
              const startX = emp.x + this.cardWidth / 2
              const startY = emp.y + this.cardHeight
              const endX = child.x + this.cardWidth / 2
              const endY = child.y
              
              const midY = startY + (endY - startY) / 2
              const path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`
              
              this.connections.push({
                id: `${emp.id}-${child.id}`,
                path,
                sourceId: emp.id,
                targetId: child.id,
                sourceLevel: emp.level,
                targetLevel: child.level
              })
            }
          })
        }
      })
    },

    toggleLayerVisibility(level) {
      if (this.visibleLayers.has(level)) {
        this.visibleLayers.delete(level)
      } else {
        this.visibleLayers.add(level)
      }
      this.visibleLayers = new Set(this.visibleLayers)
    },

    toggleEmployee(employee) {
      employee.isExpanded = !employee.isExpanded
      
      if (employee.isExpanded) {
        this.expandedNodes.add(employee.id)
      } else {
        this.expandedNodes.delete(employee.id)
      }
      
      // Only recalculate positions and connections, not metrics
      this.calculateOptimizedPositions()
      this.generateConnections()
    },

    expandAll() {
      this.allEmployees.forEach(emp => {
        if (emp.hasChildren) {
          emp.isExpanded = true
          this.expandedNodes.add(emp.id)
        }
      })
      this.calculateOptimizedPositions()
      this.generateConnections()
    },

    collapseAll() {
      this.allEmployees.forEach(emp => {
        if (emp.level > 1) {
          emp.isExpanded = false
          this.expandedNodes.delete(emp.id)
        }
      })
      this.calculateOptimizedPositions()
      this.generateConnections()
    },

    resetView() {
      if (this.$refs.scrollContainer) {
        this.$refs.scrollContainer.scrollTop = 0
        this.$refs.scrollContainer.scrollLeft = 0
      }
    },

    handleScroll(event) {
      this.scrollTop = event.target.scrollTop
      this.scrollLeft = event.target.scrollLeft
    },

    updateContainerSize() {
      if (this.$refs.scrollContainer) {
        this.containerWidth = this.$refs.scrollContainer.clientWidth
        this.containerHeight = this.$refs.scrollContainer.clientHeight
      }
    },

    getInitials(name) {
      if (!name) return '??'
      const nameParts = name.trim().split(' ')
      if (nameParts.length === 1) {
        return nameParts[0].substring(0, 2).toUpperCase()
      }
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    },

    formatCurrency(amount) {
      if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M'
      } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + 'K'
      }
      return amount.toLocaleString()
    }
  }
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

.chart-content {
  position: relative;
  min-width: 100%;
  min-height: 100%;
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

.expand-indicator {
  background-color: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  margin-top: 8px;
  display: inline-block;
}
</style> 