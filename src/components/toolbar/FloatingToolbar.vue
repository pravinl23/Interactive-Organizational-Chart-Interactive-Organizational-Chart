<template>
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
</template>

<script setup>
// Props
const props = defineProps({
  searchExpanded: Boolean,
  filtersExpanded: Boolean,
  controlsExpanded: Boolean,
  zoomExpanded: Boolean,
  statsExpanded: Boolean,
  chartsExpanded: Boolean
})

// Emits
const emit = defineEmits(['toggle-section'])

// Methods
const toggleSection = (section) => {
  emit('toggle-section', section)
}
</script>

<style scoped>
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
</style> 