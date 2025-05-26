<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">Loading and calculating hierarchy data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <p class="text-red-600">{{ error }}</p>
      </div>
    </div>

    <!-- Org Chart View (Full Screen) -->
    <OrgChart 
      v-if="!loading && !error" 
      :employees="employees" 
    />
  </div>
</template>

<script>
import OrgChart from './components/OrgChart.vue'

export default {
  name: 'App',
  components: {
    OrgChart
  },
  data() {
    return {
      employees: [],
      loading: true,
      error: null,
      orgChart: new Map(),
      metricsCache: new Map()
    }
  },
  async mounted() {
    await this.loadEmployeeData()
  },
  methods: {
    async loadEmployeeData() {
      try {
        const response = await fetch('/employees.csv')
        if (!response.ok) {
          throw new Error('Failed to load employee data')
        }
        
        const csvText = await response.text()
        const rawEmployees = this.parseCSV(csvText)
        
        // Build organizational chart
        this.buildOrgChart(rawEmployees)
        
        // Calculate metrics for each employee
        this.employees = rawEmployees.map(emp => this.enrichEmployeeWithMetrics(emp))
        
      } catch (err) {
        this.error = `Error loading data: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    
    parseCSV(csvText) {
      const lines = csvText.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      return lines.slice(1).map(line => {
        const values = this.parseCSVLine(line)
        const employee = {}
        
        headers.forEach((header, index) => {
          employee[header] = values[index] || ''
        })
        
        return {
          id: employee['Employee Id'],
          name: employee.Name,
          jobTitle: employee['Job Title'],
          email: employee.Email,
          managerId: employee.Manager || null,
          status: employee.Status,
          startDate: employee['Start Date'],
          department: employee.Department,
          location: employee.Location,
          salary: parseFloat(employee.Salary) || 0,
          bonus: parseFloat(employee.Bonus) || 0,
          photo: employee.Photo,
          performance: employee.Performance,
          level: parseInt(employee.level) || 1
        }
      })
    },
    
    parseCSVLine(line) {
      const values = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      values.push(current.trim())
      return values
    },
    
    buildOrgChart(employees) {
      // Create maps for efficient lookups
      this.orgChart.clear()
      const employeeMap = new Map()
      
      // Initialize employee records
      employees.forEach(emp => {
        employeeMap.set(emp.id, emp)
        this.orgChart.set(emp.id, {
          employee: emp,
          subordinates: [],
          manager: null
        })
      })
      
      // Build hierarchy relationships
      employees.forEach(emp => {
        if (emp.managerId && this.orgChart.has(emp.managerId)) {
          const managerNode = this.orgChart.get(emp.managerId)
          const empNode = this.orgChart.get(emp.id)
          
          managerNode.subordinates.push(emp.id)
          empNode.manager = emp.managerId
        }
      })
    },
    
    enrichEmployeeWithMetrics(employee) {
      const metrics = this.calculateEmployeeMetrics(employee.id)
      return {
        ...employee,
        metrics
      }
    },
    
    calculateEmployeeMetrics(employeeId) {
      // Use memoization for performance optimization
      if (this.metricsCache.has(employeeId)) {
        return this.metricsCache.get(employeeId)
      }
      
      const descendants = this.getAllDescendants(employeeId)
      const { managers, ics } = this.categorizeDescendants(descendants)
      
      const managerCost = managers.reduce((sum, id) => {
        const node = this.orgChart.get(id)
        return sum + (node?.employee?.salary || 0)
      }, 0)
      
      const icCost = ics.reduce((sum, id) => {
        const node = this.orgChart.get(id)
        return sum + (node?.employee?.salary || 0)
      }, 0)
      
      const totalCost = managerCost + icCost
      const managerCostRatio = totalCost > 0 ? (icCost / totalCost).toFixed(2) : '0.00'
      const managerIcRatio = ics.length > 0 ? (managers.length / ics.length).toFixed(2) : '0.00'
      
      const metrics = {
        layer: this.calculateLayer(employeeId),
        reportingLayers: this.calculateReportingLayers(employeeId),
        managerCount: managers.length,
        icCount: ics.length,
        managerCost,
        icCost,
        totalCost,
        managerCostRatio,
        managerIcRatio
      }
      
      this.metricsCache.set(employeeId, metrics)
      return metrics
    },
    
    getAllDescendants(employeeId) {
      const descendants = new Set()
      const queue = [employeeId]
      
      while (queue.length > 0) {
        const currentId = queue.shift()
        const node = this.orgChart.get(currentId)
        
        if (node && node.subordinates.length > 0) {
          node.subordinates.forEach(subId => {
            if (!descendants.has(subId)) {
              descendants.add(subId)
              queue.push(subId)
            }
          })
        }
      }
      
      return Array.from(descendants)
    },
    
    categorizeDescendants(descendantIds) {
      const managers = []
      const ics = []
      
      descendantIds.forEach(id => {
        const node = this.orgChart.get(id)
        if (node) {
          if (node.subordinates.length > 0) {
            managers.push(id)
          } else {
            ics.push(id)
          }
        }
      })
      
      return { managers, ics }
    },
    
    calculateLayer(employeeId) {
      let layer = 1
      let currentId = employeeId
      
      while (currentId) {
        const node = this.orgChart.get(currentId)
        if (node && node.manager) {
          layer++
          currentId = node.manager
        } else {
          break
        }
      }
      
      return layer
    },
    
    calculateReportingLayers(employeeId) {
      let maxDepth = 0
      
      const calculateDepth = (id, depth = 0) => {
        const node = this.orgChart.get(id)
        if (!node || node.subordinates.length === 0) {
          maxDepth = Math.max(maxDepth, depth)
          return
        }
        
        node.subordinates.forEach(subId => {
          calculateDepth(subId, depth + 1)
        })
      }
      
      calculateDepth(employeeId)
      return maxDepth
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