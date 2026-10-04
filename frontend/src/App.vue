<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">Student Management</div>
      <nav class="nav" aria-label="Main navigation">
        <RouterLink to="/students" active-class="active">Students</RouterLink>
        <RouterLink to="/courses" active-class="active">Courses</RouterLink>
        <RouterLink to="/enrollments" active-class="active">Enrollments</RouterLink>
      </nav>
    </header>

    <main class="container">
      <div v-if="notification.message" :class="['alert', notification.type]">
        {{ notification.message }}
      </div>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router'
import { useAppStore } from './stores/appStore'

const appStore = useAppStore()
const { notification } = storeToRefs(appStore)
</script>
