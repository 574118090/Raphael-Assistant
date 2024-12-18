
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.createElement('button');

    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    toggleButton.classList.add('toggle-button');
    sidebar.insertBefore(toggleButton, sidebar.firstChild);

    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
});
