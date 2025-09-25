// Dashboard-specific JavaScript
class DashboardManager {
  constructor() {
    this.mockData = {
      metrics: {
        threats: 47,
        blockedIps: 23,
        scans: 1284,
        uptime: 99.9,
        threatsChange: -12.5,
        blockedIpsChange: 8.3,
        scansChange: 15.7,
      },
      events: [
        {
          id: 1,
          type: "login",
          severity: "high",
          description: "Failed login attempt from 192.168.1.100",
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          source: "192.168.1.100",
        },
        {
          id: 2,
          type: "malware",
          severity: "medium",
          description: "Malware detected in uploaded file",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          source: "File Scanner",
        },
        {
          id: 3,
          type: "system",
          severity: "info",
          description: "System backup completed successfully",
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          source: "Backup Service",
        },
      ],
      alerts: [
        {
          id: 1,
          title: "High Risk IP Detected",
          severity: "high",
          count: 5,
        },
        {
          id: 2,
          title: "SSL Certificate Expiring",
          severity: "medium",
          count: 2,
        },
      ],
      analytics: {
        threatActivity: [
          { date: "2024-01-20", threats: 12, blocked: 8 },
          { date: "2024-01-21", threats: 18, blocked: 15 },
          { date: "2024-01-22", threats: 25, blocked: 22 },
          { date: "2024-01-23", threats: 31, blocked: 28 },
          { date: "2024-01-24", threats: 22, blocked: 19 },
          { date: "2024-01-25", threats: 35, blocked: 32 },
          { date: "2024-01-26", threats: 47, blocked: 41 },
        ],
        threatTypes: {
          "XSS Attack": 35,
          Malware: 28,
          DDoS: 15,
          "Login Attempts": 42,
          "SQL Injection": 18,
          Other: 12,
        },
        blockedIPs: [
          { ip: "192.168.1.100", count: 47, country: "US", lastSeen: "2 min ago", risk: "high" },
          { ip: "10.0.0.50", count: 32, country: "CN", lastSeen: "15 min ago", risk: "high" },
          { ip: "203.0.113.45", count: 28, country: "RU", lastSeen: "1 hour ago", risk: "medium" },
          { ip: "198.51.100.23", count: 19, country: "BR", lastSeen: "2 hours ago", risk: "medium" },
          { ip: "172.16.0.1", count: 15, country: "DE", lastSeen: "3 hours ago", risk: "low" },
        ],
        dangerousUrls: [
          { url: "malicious-site.com/payload.php", threat: "Malware Distribution", blocked: 23, risk: "high" },
          { url: "phishing-bank.net/login", threat: "Phishing", blocked: 18, risk: "high" },
          { url: "suspicious-ads.org/redirect", threat: "Malicious Redirect", blocked: 15, risk: "medium" },
          { url: "fake-update.com/download", threat: "Fake Software", blocked: 12, risk: "medium" },
          { url: "spam-tracker.net/pixel", threat: "Tracking/Spam", blocked: 8, risk: "low" },
        ],
        scanSummary: {
          clean: 1089,
          suspicious: 154,
          malicious: 41,
          total: 1284,
        },
      },
    }

    this.charts = {}
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.loadDashboard()
  }

  setupEventListeners() {
    const refreshBtn = document.getElementById("refresh-dashboard")
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshDashboard()
      })
    }

    const chartPeriodButtons = document.querySelectorAll('input[name="chart-period"]')
    chartPeriodButtons.forEach((button) => {
      button.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateThreatActivityChart(e.target.id === "chart-30d" ? 30 : 7)
        }
      })
    })
  }

  loadDashboard() {
    this.showLoading()

    // Simulate API call delay
    setTimeout(() => {
      this.loadMetrics()
      this.loadRecentEvents()
      this.loadActiveAlerts()
      this.loadAnalyticsCharts()
      this.loadBlockedIPsList()
      this.loadDangerousUrlsList()
      this.updateLastUpdated()
      this.showContent()
    }, 1500)
  }

  showLoading() {
    const loadingEl = document.getElementById("dashboard-loading")
    const contentEl = document.getElementById("dashboard-content")

    if (loadingEl) loadingEl.classList.remove("d-none")
    if (contentEl) contentEl.classList.add("d-none")
  }

  showContent() {
    const loadingEl = document.getElementById("dashboard-loading")
    const contentEl = document.getElementById("dashboard-content")

    if (loadingEl) loadingEl.classList.add("d-none")
    if (contentEl) contentEl.classList.remove("d-none")
  }

  loadMetrics() {
    const metrics = this.mockData.metrics

    // Update metric values with animation
    this.animateMetric("metric-threats", metrics.threats)
    this.animateMetric("metric-blocked-ips", metrics.blockedIps)
    this.animateMetric("metric-scans", metrics.scans)
    this.animateMetric("metric-uptime", metrics.uptime, "%")

    // Update change indicators
    this.updateChangeIndicator("threats-change", metrics.threatsChange)
    this.updateChangeIndicator("blocked-ips-change", metrics.blockedIpsChange)
    this.updateChangeIndicator("scans-change", metrics.scansChange)
  }

  animateMetric(elementId, targetValue, suffix = "") {
    const element = document.getElementById(elementId)
    if (!element) return

    const startValue = 0
    const duration = 1000
    const startTime = performance.now()

    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentValue = startValue + (targetValue - startValue) * progress

      element.textContent = Math.floor(currentValue).toLocaleString() + suffix

      if (progress < 1) {
        requestAnimationFrame(updateValue)
      }
    }

    requestAnimationFrame(updateValue)
  }

  updateChangeIndicator(elementId, changeValue) {
    const element = document.getElementById(elementId)
    if (!element) return

    const isPositive = changeValue > 0
    const parentElement = element.closest("small")

    if (parentElement) {
      parentElement.className = isPositive ? "text-danger" : "text-success"
      const icon = parentElement.querySelector("i")
      if (icon) {
        icon.className = isPositive ? "bi bi-arrow-up me-1" : "bi bi-arrow-down me-1"
      }
    }

    element.textContent = Math.abs(changeValue) + "%"
  }

  loadAnalyticsCharts() {
    this.createThreatActivityChart()
    this.createThreatTypesChart()
    this.createScanSummaryChart()
  }

  createThreatActivityChart() {
    const ctx = document.getElementById("threat-activity-chart")
    if (!ctx) return

    const data = this.mockData.analytics.threatActivity

    this.charts.threatActivity = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
        datasets: [
          {
            label: "Threats Identified",
            data: data.map((d) => d.threats),
            borderColor: "#dc3545",
            backgroundColor: "rgba(220, 53, 69, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Potential Threats Flagged",
            data: data.map((d) => d.blocked),
            borderColor: "#198754",
            backgroundColor: "rgba(25, 135, 84, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
          x: {
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
        },
      },
    })
  }

  createThreatTypesChart() {
    const ctx = document.getElementById("threat-types-chart")
    if (!ctx) return

    const data = this.mockData.analytics.threatTypes

    this.charts.threatTypes = new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
            backgroundColor: ["#dc3545", "#fd7e14", "#ffc107", "#198754", "#0dcaf0", "#6f42c1"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
        },
      },
    })
  }

  createScanSummaryChart() {
    const ctx = document.getElementById("scan-summary-chart")
    if (!ctx) return

    const data = this.mockData.analytics.scanSummary

    this.charts.scanSummary = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Clean URLs", "Suspicious URLs", "Malicious URLs"],
        datasets: [
          {
            label: "URLs Scanned",
            data: [data.clean, data.suspicious, data.malicious],
            backgroundColor: ["#198754", "#ffc107", "#dc3545"],
            borderColor: ["#198754", "#ffc107", "#dc3545"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    })
  }

  updateThreatActivityChart(days) {
    if (!this.charts.threatActivity) return

    // Simulate different data for different periods
    let data = this.mockData.analytics.threatActivity
    if (days === 30) {
      // Generate 30 days of data
      data = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        threats: Math.floor(Math.random() * 50) + 10,
        blocked: Math.floor(Math.random() * 45) + 8,
      }))
    }

    this.charts.threatActivity.data.labels = data.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    )
    this.charts.threatActivity.data.datasets[0].data = data.map((d) => d.threats)
    this.charts.threatActivity.data.datasets[1].data = data.map((d) => d.blocked)
    this.charts.threatActivity.update()
  }

  loadBlockedIPsList() {
    const container = document.getElementById("blocked-ips-list")
    if (!container) return

    const ips = this.mockData.analytics.blockedIPs

    container.innerHTML = ips
      .map(
        (ip) => `
      <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center mb-1">
            <code class="me-2">${ip.ip}</code>
            <span class="badge bg-secondary me-2">${ip.country}</span>
            <span class="status-badge status-${ip.risk}">${ip.risk}</span>
          </div>
          <small class="text-muted">
            <i class="bi bi-clock me-1"></i>
            Last seen: ${ip.lastSeen}
          </small>
        </div>
        <div class="text-end">
          <div class="fw-bold text-danger">${ip.count}</div>
          <small class="text-muted">attempts</small>
        </div>
      </div>
    `,
      )
      .join("")
  }

  loadDangerousUrlsList() {
    const container = document.getElementById("dangerous-urls-list")
    if (!container) return

    const urls = this.mockData.analytics.dangerousUrls

    container.innerHTML = urls
      .map(
        (url) => `
      <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center mb-1">
            <code class="me-2 text-truncate" style="max-width: 200px;">${url.url}</code>
            <span class="status-badge status-${url.risk}">${url.risk}</span>
          </div>
          <small class="text-muted">
            <i class="bi bi-shield-exclamation me-1"></i>
            ${url.threat}
          </small>
        </div>
        <div class="text-end">
          <div class="fw-bold text-warning">${url.blocked}</div>
          <small class="text-muted">blocked</small>
        </div>
      </div>
    `,
      )
      .join("")
  }

  loadRecentEvents() {
    const container = document.getElementById("recent-events-container")
    if (!container) return

    const events = this.mockData.events

    container.innerHTML = events
      .map(
        (event) => `
            <div class="d-flex align-items-center p-3 border-bottom">
                <div class="icon-feature me-3" style="width: 2rem; height: 2rem; font-size: 0.875rem;">
                    <i class="bi bi-${this.getEventIcon(event.type)}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${event.description}</h6>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                ${window.secureGuardApp ? window.secureGuardApp.formatTimestamp(event.timestamp) : event.timestamp.toLocaleString()}
                            </small>
                        </div>
                        <span class="status-badge status-${event.severity}">${event.severity}</span>
                    </div>
                </div>
            </div>
        `,
      )
      .join("")
  }

  loadActiveAlerts() {
    const container = document.getElementById("active-alerts-container")
    if (!container) return

    const alerts = this.mockData.alerts

    if (alerts.length === 0) {
      container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-check-circle display-4 text-success mb-2"></i>
                    <p class="text-muted mb-0">No active alerts</p>
                </div>
            `
      return
    }

    container.innerHTML = alerts
      .map(
        (alert) => `
            <div class="d-flex justify-content-between align-items-center p-3 border rounded mb-2">
                <div>
                    <h6 class="mb-1">${alert.title}</h6>
                    <small class="text-muted">${alert.count} occurrence${alert.count > 1 ? "s" : ""}</small>
                </div>
                <span class="status-badge status-${alert.severity}">${alert.severity}</span>
            </div>
        `,
      )
      .join("")
  }

  getEventIcon(type) {
    const icons = {
      login: "person-exclamation",
      malware: "bug",
      system: "gear",
      xss: "code-slash",
      ddos: "shield-exclamation",
    }
    return icons[type] || "info-circle"
  }

  updateLastUpdated() {
    const element = document.getElementById("last-updated")
    if (element) {
      element.textContent = new Date().toLocaleTimeString()
    }
  }

  refreshDashboard() {
    const refreshBtn = document.getElementById("refresh-dashboard")
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refreshing...'
      refreshBtn.disabled = true
    }

    // Destroy existing charts before refresh
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy()
    })
    this.charts = {}

    // Simulate refresh
    setTimeout(() => {
      this.loadDashboard()

      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refresh'
        refreshBtn.disabled = false
      }
    }, 1000)
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("dashboard-content")) {
    window.dashboardManager = new DashboardManager()
  }
})
