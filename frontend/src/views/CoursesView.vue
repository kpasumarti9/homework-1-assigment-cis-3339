<template>
  <section class="page">
    <div class="panel">
      <h1>Course Management</h1>
      <form class="stack" @submit.prevent="handleAddCourse">
        <div class="grid two-col">
          <label>
            <span>Course ID</span>
            <input v-model="courseForm.courseId" type="text" required />
          </label>
          <label>
            <span>Course Name</span>
            <input v-model="courseForm.name" type="text" required />
          </label>
        </div>
        <button type="submit" class="primary" :disabled="submitting">Add Course</button>
      </form>
    </div>

    <div class="panel">
      <h2>Course List</h2>
      <p v-if="loading.courses" class="helper text-muted">Loading courses...</p>
      <p v-else-if="courses.length === 0" class="empty-state">No courses available.</p>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>
              <button class="danger" type="button" @click="handleDelete(course.id)">Delete</button>
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
const { courses, loading, notification } = storeToRefs(store)

const courseForm = ref({ name: '', courseId: '' })
const submitting = ref(false)

const validateCourseForm = () => {
  const { name, courseId } = courseForm.value

  if (!name.trim() || !courseId.trim()) {
    throw new Error('Course ID and course name are required.')
  }

  if (courses.value.some((course) => String(course.id) === String(courseId.trim()))) {
    throw new Error('Course ID already exists.')
  }
}

const handleAddCourse = async () => {
  submitting.value = true
  try {
    validateCourseForm()
    await store.addCourse({
      name: courseForm.value.name.trim(),
      courseId: courseForm.value.courseId.trim(),
      id: courseForm.value.courseId.trim()
    })
    courseForm.value = { name: '', courseId: '' }
  } catch (error) {
    notification.value = { type: 'error', message: error.message }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (courseId) => {
  if (!window.confirm('Delete this course?')) {
    return
  }

  try {
    await store.deleteCourse(courseId)
  } catch (error) {
    notification.value = { type: 'error', message: error.message }
  }
}

onMounted(() => {
  store.fetchCourses()
})
</script>
