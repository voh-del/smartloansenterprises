// ====================================
// Smart Loans Enterprises
// script.js
// ====================================

// Welcome message
window.addEventListener("load", function () {
    console.log("Smart Loans Enterprises website loaded successfully.");
});

// Smooth scrolling for navigation links
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            target.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});

// Confirmation before opening WhatsApp
const applyButton = document.querySelector(".apply-btn");

if (applyButton) {
    applyButton.addEventListener("click", function (event) {

        const proceed = confirm(
            "You are about to continue your loan application on WhatsApp. Continue?"
        );

        if (!proceed) {
            event.preventDefault();
        }
    });
}

// Automatically update the copyright year
const footer = document.querySelector("footer p");

if (footer) {
    footer.innerHTML =
        "&copy; " + new Date().getFullYear() +
        " Smart Loans Enterprises. All Rights Reserved.";
}

// Registration Form
const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
    registrationForm.addEventListener("submit", function (e) {
        e.preventDefault();

        window.location.href = "payment.html";
    });
}