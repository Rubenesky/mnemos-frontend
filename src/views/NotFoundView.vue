<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="text-center">
      <p class="text-8xl font-bold text-blue-600">404</p>
      <h1 class="text-2xl font-bold text-gray-800 mt-4">Page not found</h1>
      <p class="text-gray-500 mt-2">The page you are looking for does not exist or has been removed.</p>
      <RouterLink
        to="/dashboard"
        class="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Back to home
      </RouterLink>
    </div>
  </div>
</template>
