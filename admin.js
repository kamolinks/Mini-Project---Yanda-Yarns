// Sidebar toggle

var sidebarOpen = false;
const sidebar = document.querySelector("sidebar");

function toggleSidebar() {
  if (!sidebarOpen) {
    sidebar.classList.add("sidebar-responsive");
    sidebarOpen = true;
  } else {
    sidebar.classList.remove("sidebar-responsive");
    sidebarOpen = false;
  }
}