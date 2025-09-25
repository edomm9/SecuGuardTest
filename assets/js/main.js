// Main JavaScript file for SecureGuard application
import bootstrap from "bootstrap" // Import Bootstrap for Tooltip functionality

class SecureGuardApp {
  constructor() {
    this.init()
  }

  init() {
    this.initializeTooltips()
    this.initializeAnimations()
    this.loadQuickStats()
    this.setupEventListeners()
  }

  // Initialize Bootstrap tooltips
  initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
  }

  // Initialize fade-in animations
  initializeAnimations() {
    const fadeElements = document.querySelectorAll(".fade-in")

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1"
          entry.target.style.transform = "translateY(0)"
        }
      })
    })

    fadeElements.forEach((el) => {
      el.style.opacity = "0"
      el.style.transform = "translateY(20px)"
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease"
      observer.observe(el)
    })
  }

  // Load quick statistics for homepage
  loadQuickStats() {
    const statsElements = {
      "threats-blocked": document.getElementById("threats-blocked"),
      "scans-completed": document.getElementById("scans-completed"),
      "blocked-ips": document.getElementById("blocked-ips"),
      "system-health": document.getElementById("system-health"),
    }

    // Simulate loading with animation
    setTimeout(() => {
      if (statsElements["threats-blocked"]) {
        this.animateCounter(statsElements["threats-blocked"], 0, 47, 1000)
      }
      if (statsElements["scans-completed"]) {
        this.animateCounter(statsElements["scans-completed"], 0, 1284, 1500)
      }
      if (statsElements["blocked-ips"]) {
        this.animateCounter(statsElements["blocked-ips"], 0, 23, 800)
      }
      if (statsElements["system-health"]) {
        statsElements["system-health"].textContent = "99.9%"
      }
    }, 500)

    // Load recent alerts
    this.loadRecentAlerts()
  }

  // Animate counter numbers
  animateCounter(element, start, end, duration) {
    const startTime = performance.now()

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.floor(start + (end - start) * progress)

      element.textContent = current.toLocaleString()

      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      }
    }

    requestAnimationFrame(updateCounter)
  }

  // Load recent alerts for homepage
  loadRecentAlerts() {
    const alertsContainer = document.getElementById("alerts-container")
    if (!alertsContainer) return

    const mockAlerts = [
      {
        type: "Suspicious Login",
        severity: "high",
        description: "Multiple failed login attempts detected from IP 192.168.1.100",
        time: "2 minutes ago",
        icon: "exclamation-triangle",
      },
      {
        type: "Malware Detected",
        severity: "medium",
        description: "Potential malware found in uploaded file: document.pdf",
        time: "15 minutes ago",
        icon: "bug",
      },
      {
        type: "System Update",
        severity: "low",
        description: "Security patches applied successfully to all systems",
        time: "1 hour ago",
        icon: "shield-check",
      },
    ]

    setTimeout(() => {
      alertsContainer.innerHTML = ""

      mockAlerts.forEach((alert, index) => {
        const alertCard = this.createAlertCard(alert, index)
        alertsContainer.appendChild(alertCard)
      })
    }, 1000)
  }

  // Create alert card element
  createAlertCard(alert, index) {
    const col = document.createElement("div")
    col.className = "col-md-6 col-lg-4"

    col.innerHTML = `
            <div class="card h-100 fade-in" style="animation-delay: ${index * 0.1}s;">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="icon-feature">
                            <i class="bi bi-${alert.icon}"></i>
                        </div>
                        <span class="status-badge status-${alert.severity}">${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</span>
                    </div>
                    <h5 class="card-title">${alert.type}</h5>
                    <p class="card-text text-muted">${alert.description}</p>
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>
                        ${alert.time}
                    </small>
                </div>
            </div>
        `

    return col
  }

  // Setup global event listeners
  setupEventListeners() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute("href"))
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      })
    })

    // Active navigation highlighting
    this.highlightActiveNavigation()
  }

  // Highlight active navigation item
  highlightActiveNavigation() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html"
    const navLinks = document.querySelectorAll(".nav-link")

    navLinks.forEach((link) => {
      const href = link.getAttribute("href")
      if (href === currentPage || (currentPage === "" && href === "index.html")) {
        link.classList.add("active")
      } else {
        link.classList.remove("active")
      }
    })
  }

  // Utility function to show loading state
  showLoading(element, message = "Loading...") {
    element.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">${message}</span>
                </div>
                <p class="text-muted">${message}</p>
            </div>
        `
  }

  // Utility function to show error state
  showError(element, message = "An error occurred") {
    element.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
                <h5 class="text-muted">${message}</h5>
                <button class="btn btn-outline-primary btn-sm mt-2" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Retry
                </button>
            </div>
        `
  }

  // Format timestamp
  formatTimestamp(date) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Generate random ID
  generateId() {
    return Math.random().toString(36).substr(2, 9)
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.secureGuardApp = new SecureGuardApp()
})

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = SecureGuardApp
}
