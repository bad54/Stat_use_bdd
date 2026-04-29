<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <LayoutSidebar />

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 ml-[260px]">
      <!-- Header -->
      <LayoutHeader />

      <!-- Page content -->
      <main class="flex-1 p-6 overflow-auto">
        <div class="max-w-7xl mx-auto animate-fade-in">
          <slot />
        </div>
      </main>
    </div>

    <!-- Notifications -->
    <SharedNotifications />
  </div>
</template>
