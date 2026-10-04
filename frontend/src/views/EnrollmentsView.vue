<template>
  <section class="page">
    <div class="panel">
      <h1>Enrollment Management</h1>

      <form class="stack" @submit.prevent="handleSubmit">
        <div class="grid two-col">
          <label>
            <span>Student</span>
            <select v-model="form.studentId" required>
              <option value="" disabled>Select a student</option>
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.name }} ({{ student.id }})
              </option>
            </select>
          </label>

          <label>
            <span>Course</span>
            <select v-model="form.courseId" required>
              <option value="" disabled>Select a course</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.name }} ({{ course.id }})
              </option>
            </select>
          </label>
        </div>

        <button type="submit" class="primary" :disabled="submitting || !form.studentId || !form.courseId">Enroll Student</button>
      </form>
    </div>

    <div class="panel">
      <h2>Enrollments by Course</h2>
      <div class="inline-form">
        <select v-model="selectedCourseId">
          <option value="" disabled>Select a course</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }} ({{ course.id }})
          </option>
        </select>
      </div>

      <div v-if="selectedCourseId">
        <p v-if="filteredEnrollments.length === 0" class="empty-state">No students enrolled in this course.</p>
        <ul v-else class="list">
          <li v-for="enrollment in filteredEnrollments" :key="`${enrollment.studentId}-${enrollment.courseId}`">
            {{ findStudentName(enrollment.studentId) }} - {{ findCourseName(enrollment.courseId) }}
          </li>
        </ul>
      </div>
      <p v-else class="empty-state">Choose a course to view its enrollment list.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
const { students, courses, enrollments, loading, notification } = storeToRefs(store)

const form = ref({ studentId: '', courseId: '' })
const selectedCourseId = ref('')
const submitting = ref(false)

const filteredEnrollments = computed(() => {
  if (!selectedCourseId.value) {
    return []
  }

  return enrollments.value.filter((entry) => String(entry.courseId) === String(selectedCourseId.value))
})

const findStudentName = (studentId) => {
  const student = students.value.find((item) => String(item.id) === String(studentId))
  return student ? student.name : 'Unknown Student'
}

const findCourseName = (courseId) => {
  const course = courses.value.find((item) => String(item.id) === String(courseId))
  return course ? course.name : 'Unknown Course'
}

const validateEnrollment = () => {
  if (!form.value.studentId || !form.value.courseId) {
    throw new Error('Please select both a student and a course.')
  }

  const duplicate = enrollments.value.some(
    (enrollment) => String(enrollment.studentId) === String(form.value.studentId) && String(enrollment.courseId) === String(form.value.courseId)
  )

  if (duplicate) {
    throw new Error('This student is already enrolled in that course.')
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    validateEnrollment()
    await store.addEnrollment({
      studentId: form.value.studentId,
      courseId: form.value.courseId
    })
    form.value = { studentId: '', courseId: '' }
  } catch (error) {
    notification.value = { type: 'error', message: error.message }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  store.fetchStudents()
  store.fetchCourses()
  store.fetchEnrollments()
})
</script>
