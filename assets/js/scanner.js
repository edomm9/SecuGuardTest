// Scanner-specific JavaScript
class ScannerManager {
  constructor() {
    this.isScanning = false
    this.currentScan = null
    this.scanHistory = this.loadScanHistory()

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.initializeTooltips()
    this.loadRecentScans()
  }

  setupEventListeners() {
    const scannerForm = document.getElementById("scanner-form")
    const clearFormBtn = document.getElementById("clear-form")

    if (scannerForm) {
      scannerForm.addEventListener("submit", (e) => this.handleScanSubmit(e))
    }

    if (clearFormBtn) {
      clearFormBtn.addEventListener("click", () => this.clearForm())
    }
  }

  initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (window.bootstrap) {
      tooltipTriggerList.map((tooltipTriggerEl) => new window.bootstrap.Tooltip(tooltipTriggerEl))
    }
  }

  loadScanHistory() {
    try {
      return JSON.parse(localStorage.getItem("scanHistory") || "[]")
    } catch {
      return []
    }
  }

  saveScanHistory() {
    try {
      localStorage.setItem("scanHistory", JSON.stringify(this.scanHistory.slice(-10))) // Keep last 10 scans
    } catch (e) {
      console.error("Failed to save scan history:", e)
    }
  }

  loadRecentScans() {
    if (this.scanHistory.length > 0) {
      this.displayRecentScans()
    }
  }

  displayRecentScans() {
    const resultsSection = document.getElementById("scan-results-section")
    if (resultsSection && this.scanHistory.length > 0) {
      const recentScansHtml = `
        <div class="container mb-4">
          <div class="row justify-content-center">
            <div class="col-lg-10">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-bottom">
                  <h6 class="mb-0 fw-bold">
                    <i class="bi bi-clock-history me-2"></i>
                    Recent Scans
                  </h6>
                </div>
                <div class="card-body">
                  <div class="list-group list-group-flush">
                    ${this.scanHistory
                      .slice(-5)
                      .reverse()
                      .map(
                        (scan) => `
                      <div class="list-group-item border-0 px-0 py-2">
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 class="mb-1">${scan.url}</h6>
                            <small class="text-muted">
                              ${new Date(scan.timestamp).toLocaleString()} - 
                              Score: ${scan.overallScore}/100
                            </small>
                          </div>
                          <div class="d-flex align-items-center">
                            <span class="badge ${this.getScoreBadgeClass(scan.overallScore)} me-2">
                              ${scan.overallScore}/100
                            </span>
                            <button class="btn btn-sm btn-outline-primary" onclick="scannerManager.loadScanResult('${scan.id}')">
                              <i class="bi bi-eye"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    `,
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
      resultsSection.insertAdjacentHTML("afterbegin", recentScansHtml)
      resultsSection.style.display = "block"
    }
  }

  loadScanResult(scanId) {
    const scan = this.scanHistory.find((s) => s.id === scanId)
    if (scan) {
      this.currentScan = scan
      this.showStoredScanResults(scan)
    }
  }

  showStoredScanResults(scan) {
    const progressDiv = document.getElementById("scan-progress")
    const resultsDiv = document.getElementById("scan-results")
    const scannedUrl = document.getElementById("scanned-url")
    const overallScore = document.getElementById("overall-score")

    if (progressDiv) progressDiv.style.display = "none"
    if (resultsDiv) resultsDiv.style.display = "block"
    if (scannedUrl) scannedUrl.textContent = scan.url

    if (overallScore) {
      overallScore.textContent = scan.overallScore + "/100"
      overallScore.className = `badge fs-6 px-3 py-2 ${this.getScoreBadgeClass(scan.overallScore)}`
    }

    const resultsContainer = document.getElementById("results-content")
    if (resultsContainer && scan.results) {
      resultsContainer.innerHTML = scan.results.map((result) => this.createEnhancedResultCard(result)).join("")
    }

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: "smooth" })
  }

  handleScanSubmit(e) {
    e.preventDefault()

    if (this.isScanning) return

    const formData = new FormData(e.target)
    const url = formData.get("scan-url") || document.getElementById("scan-url").value

    if (!this.validateUrl(url)) {
      this.showUrlError("Please enter a valid URL")
      return
    }

    this.clearUrlError()
    this.startScan(url)
  }

  validateUrl(url) {
    try {
      new URL(url)
      return url.startsWith("http://") || url.startsWith("https://")
    } catch {
      return false
    }
  }

  showUrlError(message) {
    const urlInput = document.getElementById("scan-url")
    const errorDiv = document.getElementById("url-error")

    if (urlInput) {
      urlInput.classList.add("is-invalid")
    }

    if (errorDiv) {
      errorDiv.textContent = message
    }
  }

  clearUrlError() {
    const urlInput = document.getElementById("scan-url")
    const errorDiv = document.getElementById("url-error")

    if (urlInput) {
      urlInput.classList.remove("is-invalid")
    }

    if (errorDiv) {
      errorDiv.textContent = ""
    }
  }

  startScan(url) {
    this.isScanning = true
    this.currentScan = {
      url: url,
      startTime: new Date(),
      options: this.getScanOptions(),
    }

    // Show results section and progress
    this.showScanProgress(url)

    // Simulate scan progress
    this.simulateScanProgress()
  }

  getScanOptions() {
    return {
      headers: document.getElementById("scan-headers")?.checked || false,
      ssl: document.getElementById("scan-ssl")?.checked || false,
      xss: document.getElementById("scan-xss")?.checked || false,
      malware: document.getElementById("scan-malware")?.checked || false,
    }
  }

  showScanProgress(url) {
    const resultsSection = document.getElementById("scan-results-section")
    const progressDiv = document.getElementById("scan-progress")
    const resultsDiv = document.getElementById("scan-results")
    const scanningUrl = document.getElementById("scanning-url")

    if (resultsSection) resultsSection.style.display = "block"
    if (progressDiv) progressDiv.style.display = "block"
    if (resultsDiv) resultsDiv.style.display = "none"
    if (scanningUrl) scanningUrl.textContent = url

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth" })
  }

  simulateScanProgress() {
    const progressBar = document.getElementById("scan-progress-bar")
    const statusText = document.getElementById("scan-status")

    const steps = [
      { progress: 10, status: "Connecting to target..." },
      { progress: 25, status: "Analyzing HTTP headers..." },
      { progress: 40, status: "Checking SSL configuration..." },
      { progress: 60, status: "Scanning for vulnerabilities..." },
      { progress: 80, status: "Running security tests..." },
      { progress: 95, status: "Generating report..." },
      { progress: 100, status: "Scan complete!" },
    ]

    let currentStep = 0

    const updateProgress = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep]

        if (progressBar) {
          progressBar.style.width = step.progress + "%"
        }

        if (statusText) {
          statusText.textContent = step.status
        }

        currentStep++

        setTimeout(updateProgress, 800 + Math.random() * 400)
      } else {
        this.showScanResults()
      }
    }

    updateProgress()
  }

  showScanResults() {
    const progressDiv = document.getElementById("scan-progress")
    const resultsDiv = document.getElementById("scan-results")
    const scannedUrl = document.getElementById("scanned-url")

    if (progressDiv) progressDiv.style.display = "none"
    if (resultsDiv) resultsDiv.style.display = "block"
    if (scannedUrl) scannedUrl.textContent = this.currentScan.url

    this.generateScanResults()
    this.isScanning = false
  }

  generateScanResults() {
    const resultsContainer = document.getElementById("results-content")
    const overallScore = document.getElementById("overall-score")

    if (!resultsContainer) return

    // Generate mock results based on scan options
    const results = this.generateMockResults()

    // Set overall score
    const score = this.calculateOverallScore(results)
    if (overallScore) {
      overallScore.textContent = score + "/100"
      overallScore.className = `badge fs-6 px-3 py-2 ${this.getScoreBadgeClass(score)}`
    }

    const scanRecord = {
      id: Date.now().toString(),
      url: this.currentScan.url,
      timestamp: new Date().toISOString(),
      overallScore: score,
      results: results,
      options: this.currentScan.options,
    }

    this.scanHistory.push(scanRecord)
    this.saveScanHistory()

    // Render results with enhanced details
    resultsContainer.innerHTML = results.map((result) => this.createEnhancedResultCard(result)).join("")
  }

  createEnhancedResultCard(result) {
    const statusColors = {
      excellent: "success",
      good: "success",
      warning: "warning",
      danger: "danger",
    }

    const statusColor = statusColors[result.status] || "secondary"

    return `
      <div class="col-lg-6 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white border-bottom">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">
                <i class="bi bi-${result.icon} me-2"></i>
                ${result.title}
              </h6>
              <div class="d-flex align-items-center">
                <span class="badge bg-${statusColor} me-2">${result.status}</span>
                <span class="fw-bold">${result.score}/100</span>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-${statusColor}" 
                     role="progressbar" 
                     style="width: ${result.score}%"></div>
              </div>
              <div class="d-flex justify-content-between mt-2">
                <small class="text-muted">Security Level</small>
                <small class="fw-semibold">${this.getSecurityLevel(result.score)}</small>
              </div>
            </div>
            
            ${
              result.summary
                ? `
              <div class="alert alert-${statusColor === "danger" ? "danger" : statusColor === "warning" ? "warning" : "info"} alert-dismissible fade show" role="alert">
                <i class="bi bi-info-circle me-2"></i>
                ${result.summary}
              </div>
            `
                : ""
            }
            
            <div class="list-group list-group-flush">
              ${result.details
                .map(
                  (detail) => `
                    <div class="list-group-item border-0 px-0">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center mb-1">
                            <h6 class="mb-0 me-2">${detail.name}</h6>
                            <span class="badge bg-${this.getDetailStatusColor(detail.status)} badge-sm">${detail.status}</span>
                          </div>
                          <small class="text-muted d-block">${detail.description}</small>
                          ${
                            detail.recommendation
                              ? `
                            <small class="text-primary d-block mt-1">
                              <i class="bi bi-lightbulb me-1"></i>
                              ${detail.recommendation}
                            </small>
                          `
                              : ""
                          }
                        </div>
                        ${
                          detail.severity
                            ? `
                          <span class="badge bg-${this.getSeverityColor(detail.severity)} ms-2">
                            ${detail.severity}
                          </span>
                        `
                            : ""
                        }
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
            
            <div class="mt-3 pt-3 border-top">
              <div class="row text-center">
                <div class="col-4">
                  <div class="text-muted small">Issues Found</div>
                  <div class="fw-bold">${result.details.filter((d) => d.status === "missing" || d.status === "weak").length}</div>
                </div>
                <div class="col-4">
                  <div class="text-muted small">Passed</div>
                  <div class="fw-bold text-success">${result.details.filter((d) => d.status === "present" || d.status === "good" || d.status === "strong").length}</div>
                </div>
                <div class="col-4">
                  <div class="text-muted small">Warnings</div>
                  <div class="fw-bold text-warning">${result.details.filter((d) => d.status === "partial").length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  getSecurityLevel(score) {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    if (score >= 60) return "Poor"
    return "Critical"
  }

  getSeverityColor(severity) {
    const colors = {
      critical: "danger",
      high: "danger",
      medium: "warning",
      low: "info",
      info: "secondary",
    }
    return colors[severity] || "secondary"
  }

  generateMockResults() {
    const results = []
    const options = this.currentScan.options

    if (options.headers) {
      results.push({
        title: "Security Headers Analysis",
        icon: "shield-check",
        status: "warning",
        score: 75,
        summary: "Some important security headers are missing. Consider implementing CSP and HSTS.",
        details: [
          {
            name: "Content-Security-Policy",
            status: "missing",
            description: "CSP header not found - vulnerable to XSS attacks",
            recommendation: "Implement a strict CSP policy",
            severity: "high",
          },
          {
            name: "X-Frame-Options",
            status: "present",
            description: "Clickjacking protection is properly configured",
            severity: "info",
          },
          {
            name: "Strict-Transport-Security",
            status: "partial",
            description: "HSTS header present but max-age could be longer",
            recommendation: "Increase max-age to at least 31536000 seconds",
            severity: "medium",
          },
          {
            name: "X-Content-Type-Options",
            status: "present",
            description: "MIME type sniffing protection enabled",
            severity: "info",
          },
        ],
      })
    }

    if (options.ssl) {
      results.push({
        title: "SSL/TLS Security Assessment",
        icon: "lock-fill",
        status: "excellent",
        score: 95,
        summary: "Excellent SSL/TLS configuration with modern security standards.",
        details: [
          {
            name: "Certificate Validity",
            status: "valid",
            description: "Certificate is valid and issued by trusted CA",
            severity: "info",
          },
          {
            name: "Protocol Support",
            status: "strong",
            description: "TLS 1.3 supported, weak protocols disabled",
            severity: "info",
          },
          {
            name: "Cipher Suite Strength",
            status: "strong",
            description: "Only strong cipher suites are supported",
            severity: "info",
          },
          {
            name: "Certificate Transparency",
            status: "present",
            description: "Certificate is logged in CT logs",
            severity: "info",
          },
        ],
      })
    }

    if (options.xss) {
      results.push({
        title: "Cross-Site Scripting (XSS) Assessment",
        icon: "code-slash",
        status: "warning",
        score: 65,
        summary: "Potential XSS vulnerabilities detected. Input validation needs improvement.",
        details: [
          {
            name: "Input Validation",
            status: "partial",
            description: "Some form inputs lack proper server-side validation",
            recommendation: "Implement comprehensive input sanitization",
            severity: "high",
          },
          {
            name: "Output Encoding",
            status: "good",
            description: "Most user-generated content is properly encoded",
            severity: "low",
          },
          {
            name: "DOM-based XSS Protection",
            status: "missing",
            description: "Client-side XSS protection mechanisms not detected",
            recommendation: "Implement DOM purification libraries",
            severity: "medium",
          },
          {
            name: "Reflected XSS Prevention",
            status: "partial",
            description: "Some URL parameters are not properly sanitized",
            recommendation: "Validate and encode all URL parameters",
            severity: "medium",
          },
        ],
      })
    }

    if (options.malware) {
      results.push({
        title: "Malware & Threat Detection",
        icon: "bug-fill",
        status: "good",
        score: 88,
        summary: "No active malware detected. External resources verified as safe.",
        details: [
          {
            name: "Known Malware Signatures",
            status: "clean",
            description: "No known malware patterns detected in content",
            severity: "info",
          },
          {
            name: "Suspicious JavaScript",
            status: "clean",
            description: "All JavaScript code appears legitimate",
            severity: "info",
          },
          {
            name: "External Resource Verification",
            status: "verified",
            description: "All external resources checked against threat databases",
            severity: "info",
          },
          {
            name: "Phishing Indicators",
            status: "clean",
            description: "No phishing patterns or suspicious redirects found",
            severity: "info",
          },
        ],
      })
    }

    return results
  }

  getDetailStatusColor(status) {
    const colors = {
      present: "success",
      valid: "success",
      good: "success",
      strong: "success",
      clean: "success",
      verified: "success",
      partial: "warning",
      missing: "danger",
      weak: "danger",
      invalid: "danger",
    }

    return colors[status] || "secondary"
  }

  calculateOverallScore(results) {
    if (results.length === 0) return 0

    const totalScore = results.reduce((sum, result) => sum + result.score, 0)
    return Math.round(totalScore / results.length)
  }

  getScoreBadgeClass(score) {
    if (score >= 90) return "bg-success"
    if (score >= 70) return "bg-warning"
    return "bg-danger"
  }

  clearForm() {
    const form = document.getElementById("scanner-form")
    const resultsSection = document.getElementById("scan-results-section")

    if (form) {
      form.reset()
      // Reset checkboxes to default state
      document.getElementById("scan-headers").checked = true
      document.getElementById("scan-ssl").checked = true
      document.getElementById("scan-xss").checked = false
      document.getElementById("scan-malware").checked = false
    }

    if (resultsSection) {
      resultsSection.style.display = "none"
    }

    this.clearUrlError()
    this.isScanning = false
    this.currentScan = null
  }
}

// Initialize scanner manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("scanner-form")) {
    window.scannerManager = new ScannerManager()
  }
})
