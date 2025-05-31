#  Interactive Organizational Chart

A modern, interactive organizational chart visualization built with Vue.js, D3.js, and Tailwind CSS. This application provides comprehensive organizational insights with advanced analytics, search capabilities, and intuitive navigation.

## 🚀 Features

### Core Visualization
- **Interactive Org Chart**: Hierarchical employee visualization with expandable/collapsible nodes
- **Real-time Search**: Find employees instantly with live search and highlighting
- **Layer Management**: Toggle visibility of organizational layers
- **Zoom & Pan**: Smooth zoom controls with keyboard and mouse support
- **Responsive Design**: Optimized for various screen sizes

### Advanced Analytics
- **Employee Metrics**: Comprehensive calculations including:
  - Organizational layer depth
  - Reporting layers count
  - Manager vs Individual Contributor ratios
  - Cost analysis (manager cost, IC cost, total cost)
  - Manager-to-IC ratios
- **Data Visualizations**: Multiple chart views for organizational insights
- **Performance Optimization**: Efficient algorithms with memoization for large datasets

### User Experience
- **Floating Toolbar**: Quick access to all features
- **Keyboard Navigation**: Full keyboard support (WASD/Arrow keys, +/- zoom)
- **Search & Filter**: Advanced filtering by department, level, and other criteria
- **Expandable Panels**: Organized UI with collapsible sections
- **Loading States**: Smooth loading indicators and error handling

## 🛠️ Technology Stack

- **Frontend Framework**: Vue.js 3 (Composition API)
- **Styling**: Tailwind CSS
- **Data Visualization**: D3.js
- **Build Tool**: Vite
- **Language**: JavaScript (ES6+)

## 📊 Data Format

The application expects employee data in CSV format located at `/public/employees.csv`. The CSV should include the following columns:

- `Employee Id`: Unique identifier
- `Name`: Employee full name
- `Job Title`: Position title
- `Email`: Employee email address
- `Manager`: Manager's Employee Id (for hierarchy)
- `Status`: Employment status
- `Start Date`: Employment start date
- `Department`: Department name
- `Location`: Work location
- `Salary`: Annual salary
- `Bonus`: Annual bonus
- `Photo`: Profile photo URL
- `Performance`: Performance rating
- `level`: Organizational level

## 🎮 Usage

### Navigation
- **Mouse**: Click and drag to pan, scroll wheel to zoom
- **Keyboard**: 
  - `W/A/S/D` or `Arrow Keys`: Navigate the chart
  - `+/-`: Zoom in/out
  - `Ctrl + Scroll`: Zoom with mouse wheel

### Search & Filtering
1. Click the search icon in the floating toolbar
2. Type employee name, title, or department
3. Results appear with highlighting
4. Click on search results to navigate to employee

### Layer Management
1. Open the filters panel
2. Toggle visibility for different organizational layers
3. Use color coding to distinguish levels

### Analytics Views
1. Click the charts icon in the toolbar
2. Switch between different analytical visualizations
3. Explore organizational metrics and insights
