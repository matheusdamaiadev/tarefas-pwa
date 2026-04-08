<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <input
      v-model="newTask"
      type="text"
      placeholder="Nova tarefa..."
      class="task-input"
    />

    <!-- 🔽 prioridade -->
    <select v-model="priority" class="task-select">
      <option value="baixa">Baixa</option>
      <option value="normal">Normal</option>
      <option value="alta">Alta</option>
    </select>

    <button type="submit" class="task-button">
      {{ editingTask ? 'Alterar' : 'Adicionar' }}
    </button>

    <button
      v-if="editingTask"
      type="button"
      class="task-button-cancel"
      @click="handleCancel"
    >
      Cancelar
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['add', 'update', 'cancel']);

const newTask = ref('');
const priority = ref('normal'); // 🔽 novo

watch(
  () => props.editingTask,
  (task) => {
    if (task) {
      newTask.value = task.title;
      priority.value = task.priority || 'normal'; // 🔽 importante
    } else {
      newTask.value = '';
      priority.value = 'normal';
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!newTask.value.trim()) return;

  if (props.editingTask) {
    emit('update', props.editingTask.id, newTask.value.trim());
  } else {
    emit('add', newTask.value.trim(), priority.value); // 🔽 envia prioridade
  }

  newTask.value = '';
  priority.value = 'normal';
}

function handleCancel() {
  newTask.value = '';
  priority.value = 'normal';
  emit('cancel');
}
</script>

<style scoped>
.task-form {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.task-select {
  padding: 12px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.task-button {
  padding: 12px 20px;
  background-color: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
}

.task-button-cancel {
  padding: 12px 16px;
  background-color: transparent;
  border: 2px solid #ddd;
  border-radius: 8px;
}
</style>