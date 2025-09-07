<template>
  <div v-if="renderError" class="diagram-error">
    <div class="error-message">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>Failed to render diagram</span>
      <button @click="toggleErrorDetails" class="error-toggle-button">
        {{ showErrorDetails ? "Hide Details" : "Show Details" }}
      </button>
    </div>
    <pre v-if="showErrorDetails" class="error-details">{{
      renderErrorDetails
    }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  renderError: boolean;
  renderErrorDetails: string;
}>();

const showErrorDetails = ref(false);

const toggleErrorDetails = () => {
  showErrorDetails.value = !showErrorDetails.value;
};
</script>

<style scoped>
.diagram-error {
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c53030;
  font-weight: 500;
}

.error-message svg {
  flex-shrink: 0;
  stroke: #c53030;
}

.error-toggle-button {
  background: #c53030;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: auto;
}

.error-toggle-button:hover {
  background: #9c2626;
}

.error-details {
  margin-top: 12px;
  padding: 12px;
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #2d3748;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}
</style>
