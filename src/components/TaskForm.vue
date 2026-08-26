<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <div class="task-row">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="task-input"
      />
      <button type="submit" class="task-button" :disabled="uploading || loadingLocation">
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
    </div>

    <!-- Seção de Imagem -->
    <div class="image-section">
      <img
        v-if="previewUrl || editingTask?.img_url"
        :src="previewUrl || editingTask?.img_url"
        class="image-preview"
        alt="Imagem da tarefa"
      />
      <label class="image-label" :class="{ disabled: uploading }">
        <span v-if="uploading" class="upload-status">Enviando...</span>
        <span v-else>
          {{ previewUrl || editingTask?.img_url
            ? 'Trocar imagem'
            : isMobileDevice
              ? 'Fotografar'
              : 'Adicionar imagem'
          }}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          class="image-input"
          :disabled="uploading"
          @change="handleImageChange"
        />
      </label>

      <p class="image-help">
        Em celular, o botão pode abrir a câmera. Em notebook, abre o seletor de arquivos.
      </p>
    </div>

    <!-- Seção de Localização -->
    <div class="location-section">
      <div class="location-actions">
        <button
          type="button"
          class="location-button"
          :disabled="loadingLocation"
          @click="handleObterLocalizacao"
        >
          {{ loadingLocation ? 'Obtendo localização...' : (location ? 'Atualizar Localização' : 'Adicionar Localização') }}
        </button>

        <button
          v-if="location"
          type="button"
          class="location-button-remove"
          @click="handleRemoverLocalizacao"
        >
          Remover Localização
        </button>
      </div>

      <p v-if="locationError" class="location-error">
        {{ locationError }}
      </p>

      <div v-if="location" class="location-details">
        <p v-if="location.label" class="location-label-text">
          📍 <strong>Endereço:</strong> {{ location.label }}
        </p>
        <p class="location-coords-text">
          <strong>Coordenadas:</strong> {{ Number(location.latitude).toFixed(5) }}, {{ Number(location.longitude).toFixed(5) }}
        </p>

        <TaskLocationMap :location="location" />
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import tasksApi from '../api/tasksApi.js'
import geocodingApi from '../api/geocodingApi.js'
import { useGeolocation } from '../composables/useGeolocation.js'
import { buildLocationPayload } from '../utils/location.js'
import TaskLocationMap from './TaskLocationMap.vue'

const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['add', 'update', 'cancel'])

const newTask = ref('')
const previewUrl = ref(null)
const imgAttachmentKey = ref(null)
const uploading = ref(false)

const isMobileDevice = ref(!window.matchMedia('(pointer: fine)').matches)

const {
  location,
  loadingLocation,
  locationError,
  requestCurrentLocation,
  setLocationFromTask,
  setLocationLabel,
  clearLocation,
} = useGeolocation()

watch(
  () => props.editingTask,
  (task) => {
    newTask.value = task ? task.title : ''
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
    imgAttachmentKey.value = null

    if (task) {
      setLocationFromTask(task)
    } else {
      clearLocation()
    }
  },
  { immediate: true }
)

async function handleObterLocalizacao() {
  const captured = await requestCurrentLocation()
  if (!captured) return

  try {
    const address = await geocodingApi.reverse(
      captured.latitude,
      captured.longitude,
    )
    setLocationLabel(address?.label)
  } catch {
    locationError.value = 'Localização obtida, mas não foi possível identificar a rua.'
  }
}

function handleRemoverLocalizacao() {
  clearLocation()
}

async function handleImageChange(event) {
  const file = event.target.files[0]
  if (!file) return

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true

  try {
    const response = await tasksApi.uploadImage(file)
    imgAttachmentKey.value = response.data.attachment_key
  } catch (err) {
    console.error('Erro ao fazer upload da imagem', err)
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
    imgAttachmentKey.value = null
  } finally {
    uploading.value = false
  }
}

function handleSubmit() {
  if (!newTask.value.trim()) return

  const payload = {
    title: newTask.value.trim(),
    imgAttachmentKey: imgAttachmentKey.value,
    ...buildLocationPayload(location.value),
  }

  if (props.editingTask) {
    emit('update', props.editingTask.id, payload)
  } else {
    emit('add', payload)
  }

  newTask.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  imgAttachmentKey.value = null
  clearLocation()
}

function handleCancel() {
  newTask.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  imgAttachmentKey.value = null
  clearLocation()
  emit('cancel')
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.task-form {
  margin-bottom: 24px;
}

.task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.task-input:focus {
  border-color: #4a90d9;
}

.task-button {
  padding: 12px 20px;
  background-color: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-button:hover:not(:disabled) {
  background-color: #357abd;
}

.task-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-button-cancel {
  padding: 12px 16px;
  background-color: transparent;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.task-button-cancel:hover {
  border-color: #aaa;
}

.image-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ccc;
  margin-bottom: 12px;
}

.image-preview {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.image-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid #4a90d9;
  color: #4a90d9;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-label:hover:not(.disabled) {
  background: #eaf2fb;
}

.image-label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-input {
  display: none;
}

.upload-status {
  color: #888;
}

.image-help {
  font-size: 0.75rem;
  color: #999;
  margin: 0;
  flex-basis: 100%;
}

.location-section {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.location-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.location-button {
  padding: 8px 14px;
  background-color: white;
  border: 1.5px solid #28a745;
  color: #28a745;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.location-button:hover:not(:disabled) {
  background-color: #e9f7ef;
}

.location-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.location-button-remove {
  padding: 8px 14px;
  background-color: white;
  border: 1.5px solid #dc3545;
  color: #dc3545;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.location-button-remove:hover {
  background-color: #fdf2f2;
}

.location-error {
  color: #dc3545;
  font-size: 0.85rem;
  margin: 8px 0 0 0;
}

.location-details {
  margin-top: 10px;
}

.location-label-text,
.location-coords-text {
  margin: 4px 0;
  font-size: 0.875rem;
  color: #333;
}
</style>