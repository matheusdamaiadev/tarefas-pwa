<template>
  <div>
    <!-- 🔁 erro + retry -->
    <div v-if="store.error" class="error-message">
      <p>{{ store.error }}</p>
      <button @click="store.fetchTasks()">Tentar novamente</button>
    </div>

    <!-- 🔎 campo de busca -->
    <input
      v-model="store.filterText"
      placeholder="Buscar tarefas..."
      class="search-input"
    />

    <TaskForm
      :editing-task="editingTask"
      @add="handleAdd"
      @update="handleUpdate"
      @cancel="handleCancel"
    />

    <p v-if="store.loading" class="loading-message">
      Carregando tarefas...
    </p>

    <template v-else>
      <!-- Pendentes -->
      <section v-if="store.filteredPendingTasks.length > 0">
        <h2 class="section-title">
          Pendentes ({{ store.filteredPendingTasks.length }})
        </h2>

        <TaskItem
          v-for="task in store.filteredPendingTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @remove="handleRemove"
          @edit="handleEdit"
        />
      </section>

      <!-- Concluídas -->
      <section v-if="store.filteredCompletedTasks.length > 0">
        <h2 class="section-title">
          Concluídas ({{ store.filteredCompletedTasks.length }})
        </h2>

        <TaskItem
          v-for="task in store.filteredCompletedTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @remove="handleRemove"
          @edit="handleEdit"
        />
      </section>

      <!-- vazio -->
      <p v-if="store.tasks.length === 0" class="empty-message">
        Nenhuma tarefa cadastrada. Adicione uma acima.
      </p>
    </template>

    <InstallButton />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import TaskForm from '../components/TaskForm.vue';
import TaskItem from '../components/TaskItem.vue';
/*import InstallButton from '../components/InstallButton.vue';*/
import { useTasksStore } from '../stores/tasks.js';

const store = useTasksStore();
const editingTask = ref(null);

onMounted(() => {
  store.fetchTasks();
});

// ✅ adicionar
function handleAdd(title, priority) {
  store.addTask(title, priority);
}

// 🔥 CORREÇÃO AQUI (faltava isso)
function handleUpdate(id, title, priority) {
  store.updateTask(id, { title, priority });
  editingTask.value = null;
}

function handleCancel() {
  editingTask.value = null;
}

function handleEdit(task) {
  editingTask.value = task;
}

function handleToggle(id) {
  store.toggleTask(id);
}

function handleRemove(id) {
  if (editingTask.value?.id === id) editingTask.value = null;
  store.removeTask(id);
}
</script>

<style scoped>
.search-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.section-title {
  font-size: 1rem;
  color: #666;
  margin-bottom: 12px;
  margin-top: 20px;
}

.empty-message {
  text-align: center;
  color: #999;
  margin-top: 40px;
  font-size: 0.95rem;
}

.error-message {
  color: #c0392b;
  background-color: #fdecea;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.loading-message {
  color: #666;
  font-size: 0.9rem;
  padding: 8px 0;
}
</style>