<template>
  <div class="analytics-container">
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
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  currentView: {
    type: String,
    required: true
  },
  allEmployees: {
    type: Array,
    required: true
  },
  levelColors: {
    type: Object,
    required: true
  },
  availableLevels: {
    type: Array,
    required: true
  }
})

// Computed properties
const realEmployeeCount = computed(() => props.allEmployees.filter(emp => !emp.isVirtualRoot).length)

const departmentData = computed(() => {
  const deptCounts = {}
  const realEmps = props.allEmployees.filter(emp => !emp.isVirtualRoot)
  
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

const pyramidData = computed(() => {
  const levels = {}
  const realEmps = props.allEmployees.filter(emp => !emp.isVirtualRoot)
  
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
  const realEmps = props.allEmployees.filter(emp => !emp.isVirtualRoot)
  
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
  return [...new Set(props.allEmployees.filter(emp => !emp.isVirtualRoot).map(emp => emp.department))]
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

// Methods
const formatCurrency = (amount) => {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K'
  }
  return amount.toLocaleString()
}

const getHeatmapValue = (level, department) => {
  const employees = props.allEmployees.filter(emp => 
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
</script>

<style scoped>
/* Analytics Container */
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
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
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
</style> 