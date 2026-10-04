import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function requestJson(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.error || 'Request failed.'
    throw new Error(message)
  }

  return data
}

export const useAppStore = defineStore('app', () => {
  const students = ref([])
  const courses = ref([])
  const enrollments = ref([])
  const loading = ref({ students: false, courses: false, enrollments: false })
  const notification = ref({ type: '', message: '' })

  function clearNotification() {
    notification.value = { type: '', message: '' }
  }

  async function fetchStudents() {
    loading.value.students = true
    try {
      students.value = await requestJson('/api/students')
    } catch (error) {
      notification.value = { type: 'error', message: error.message }
    } finally {
      loading.value.students = false
    }
  }

  async function addStudent(payload) {
    const result = await requestJson('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    students.value = [...students.value, result.student]
    notification.value = { type: 'success', message: 'Student added successfully.' }
    return result
  }

  async function searchStudent(name) {
    return requestJson('/find-student', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }

  async function deleteStudent(studentId) {
    const result = await requestJson(`/api/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE'
    })

    students.value = students.value.filter((student) => String(student.id) !== String(studentId))
    enrollments.value = enrollments.value.filter((enrollment) => String(enrollment.studentId) !== String(studentId))
    notification.value = { type: 'success', message: result.message || 'Student deleted successfully.' }
    return result
  }

  async function fetchCourses() {
    loading.value.courses = true
    try {
      courses.value = await requestJson('/api/courses')
    } catch (error) {
      notification.value = { type: 'error', message: error.message }
    } finally {
      loading.value.courses = false
    }
  }

  async function addCourse(payload) {
    const result = await requestJson('/api/courses', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    courses.value = [...courses.value, result.course]
    notification.value = { type: 'success', message: 'Course added successfully.' }
    return result
  }

  async function deleteCourse(courseId) {
    const result = await requestJson(`/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'DELETE'
    })

    courses.value = courses.value.filter((course) => String(course.id) !== String(courseId))
    enrollments.value = enrollments.value.filter((enrollment) => String(enrollment.courseId) !== String(courseId))
    notification.value = { type: 'success', message: result.message || 'Course deleted successfully.' }
    return result
  }

  async function fetchEnrollments() {
    loading.value.enrollments = true
    try {
      enrollments.value = await requestJson('/api/enrollments')
    } catch (error) {
      notification.value = { type: 'error', message: error.message }
    } finally {
      loading.value.enrollments = false
    }
  }

  async function addEnrollment(payload) {
    const result = await requestJson('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    enrollments.value = [...enrollments.value, result.enrollment]
    notification.value = { type: 'success', message: 'Enrollment added successfully.' }
    return result
  }

  return {
    students,
    courses,
    enrollments,
    loading,
    notification,
    clearNotification,
    fetchStudents,
    addStudent,
    searchStudent,
    deleteStudent,
    fetchCourses,
    addCourse,
    deleteCourse,
    fetchEnrollments,
    addEnrollment
  }
})
