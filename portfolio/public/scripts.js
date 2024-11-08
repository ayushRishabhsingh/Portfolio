// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Toggle Mobile Navigation Menu
const burgerMenu = document.getElementById('burger-menu');
const navLinks = document.getElementById('nav-links');

burgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('nav-active');
    burgerMenu.classList.toggle('toggle');
});
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Show confirmation message
    document.getElementById('confirmationMessage').style.display = 'block';
    // Clear form fields
    document.getElementById('contactForm').reset();
});