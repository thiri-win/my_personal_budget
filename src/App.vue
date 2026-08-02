<script setup>
import Navbar from './components/Navbar.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <Navbar />
  <div class="container mx-auto p-4">
    <RouterView />
  </div>
</template>

<style scoped></style>
