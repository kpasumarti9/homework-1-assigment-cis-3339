<template>
  <section class="page">
    <div class="panel">
      <h1>Student Management</h1>
      <form class="stack" @submit.prevent="handleAddStudent">
        <div class="grid two-col">
          <label>
            <span>Name</span>
            <input v-model="studentForm.name" type="text" required />
          </label>
          <label>
            <span>Student ID</span>
            <input v-model="studentForm.studentId" type="text" required />
          </label>
          <label>
            <span>Phone</span>
            <input v-model="studentForm.phone" type="tel" required />
          </label>
          <label>
            <span>ZIP Code</span>
            <input v-model="studentForm.zip" type="text" required />
          </label>
        </div>
        <button type="submit" class="primary" :disabled="submitting">Add Student</button>
      </form>
    </div>

    <div class="panel">
      <h2>Search Student</h2>
      <form class="inline-form" @submit.prevent="handleSearch">
        <input v-model="searchName" type="text" placeholder="Student name" />
        <button type="submit" class="secondary">Search</button>
      </form>

      <div v-if="searchResult" class="result-box">
        <h3>Search Result</h3>
        <p><strong>Name:</strong> {{ searchResult.name }}</p>
        <p><strong>Student ID:</strong> {{ searchResult.id }}</p>
        <p><strong>Phone:</strong> {{ searchResult.phone }}</p>
        <p><strong>ZIP:</strong> {{ searchResult.zip }}</p>
      </div>
      <p v-else-if="searchAttempted" class="empty-state">No student found.</p>
    </div>

    <div class="panel">
      <h2>Student List</h2>
      <p v-if="loading.students" class="helper text-muted">Loading students...</p>
      <p v-else-if="students.length === 0" class="empty-state">No students yet.</p>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Student ID</th>
            <th>Phone</th>
            <th>ZIP</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.name }}</td>
            <td>{{ student.id }}</td>
            <td>{{ student.phone }}</td>
            <td>{{ student.zip }}</td>
            <td>
              <button class="danger" type="button" @click="handleDelete(student.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
const { students, loading, notification } = storeToRefs(store)

const studentForm = ref({
  name: '',
  studentId: '',
  phone: '',
  zip: ''
})

const searchName = ref('')
const searchResult = ref(null)
const searchAttempted = ref(false)
const submitting = ref(false)

const validateStudentForm = () => {
  const { name, studentId, phone, zip } = studentForm.value

  if (!name.trim() || !studentId.trim() || !phone.trim() || !zip.trim()) {
    throw new Error('All student fields are required.')
  }

  if (students.value.some((student) => String(student.id) === String(studentId.trim()))) {
    throw new Error('Student ID already exists.')
  }
}

const handleAddStudent = async () => {
  submitting.value = true
  try {
    validateStudentForm()
    await store.addStudent({
      name: studentForm.value.name.trim(),
      studentId: studentForm.value.studentId.trim(),
      id: studentForm.value.studentId.trim(),
      phone: studentForm.value.phone.trim(),
      zip: studentForm.value.zip.trim()
    })
    studentForm.value = { name: '', studentId: '', phone: '', zip: '' }
  } catch (error) {
    notification.value = { type: 'error', message: error.message }
  } finally {
    submitting.value = false
  }
}

const handleSearch = async () => {
  if (!searchName.value.trim()) {
    searchResult.value = null
    searchAttempted.value = false
    return
  }

  try {
    const result = await store.searchStudent(searchName.value.trim())
    searchResult.value = result
    searchAttempted.value = true
  } catch (error) {
    searchResult.value = null
    searchAttempted.value = true
    notification.value = { type: 'error', message: error.message }
  }
}

const handleDelete = async (studentId) => {
  if (!window.confirm('Delete this student?')) {
    return
  }

  try {
    await store.deleteStudent(studentId)
    searchResult.value = null
    searchAttempted.value = false
  } catch (error) {
    notification.value = { type: 'error', message: error.message }
  }
}

onMounted(() => {
  store.fetchStudents()
})
</script>
