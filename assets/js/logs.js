// Logs-specific JavaScript
class LogsManager {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.filters = {
      severity: "",
      eventType: "",
      dateRange: "today",
      searchText: "",
      sourceIP: "",
      statusCode: "",
      startDate: null,
      endDate: null,
    };

    this.mockLogs = this.generateMockLogs();
    this.filteredLogs = [...this.mockLogs];
    this.uploadedLogs = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadLogs();
  }

  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById("refresh-logs");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshLogs());
    }

    // File upload event listeners
    const fileUpload = document.getElementById("log-file-upload");
    const uploadBtn = document.getElementById("upload-logs-btn");

    if (fileUpload) {
      fileUpload.addEventListener("change", (e) => this.handleFileSelection(e));
    }

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => this.uploadAndParseLogs());
    }

    // Search functionality
    const searchInput = document.getElementById("search-logs");
    const clearSearchBtn = document.getElementById("clear-search");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filters.searchText = e.target.value;
        this.applyFilters();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        this.filters.searchText = "";
        this.applyFilters();
      });
    }

    // Filter controls
    const severityFilter = document.getElementById("severity-filter");
    const eventTypeFilter = document.getElementById("event-type-filter");
    const dateFilter = document.getElementById("date-filter");
    const ipFilter = document.getElementById("ip-filter");
    const statusFilter = document.getElementById("status-filter");
    const clearFiltersBtn = document.getElementById("clear-filters");

    if (severityFilter) {
      severityFilter.addEventListener("change", (e) => {
        this.filters.severity = e.target.value;
        this.applyFilters();
      });
    }

    if (eventTypeFilter) {
      eventTypeFilter.addEventListener("change", (e) => {
        this.filters.eventType = e.target.value;
        this.applyFilters();
      });
    }

    if (dateFilter) {
      dateFilter.addEventListener("change", (e) => {
        this.filters.dateRange = e.target.value;
        this.toggleCustomDateRange(e.target.value === "custom");
        this.applyFilters();
      });
    }

    if (ipFilter) {
      ipFilter.addEventListener("input", (e) => {
        this.filters.sourceIP = e.target.value;
        this.applyFilters();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", (e) => {
        this.filters.statusCode = e.target.value;
        this.applyFilters();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => this.clearFilters());
    }

    // Custom date range functionality
    const applyDateRangeBtn = document.getElementById("apply-date-range");
    if (applyDateRangeBtn) {
      applyDateRangeBtn.addEventListener("click", () => this.applyCustomDateRange());
    }
  }

  handleFileSelection(event) {
    const files = event.target.files;
    const uploadBtn = document.getElementById("upload-logs-btn");

    if (files.length > 0) {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = `<i class="bi bi-cloud-upload me-1"></i>Upload ${files.length} file(s)`;
    } else {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i>Upload & Parse';
    }
  }

  async uploadAndParseLogs() {
    const fileInput = document.getElementById("log-file-upload");
    const formatSelect = document.getElementById("log-format");
    const progressContainer = document.getElementById("upload-progress");
    const progressBar = progressContainer.querySelector(".progress-bar");

    if (!fileInput.files.length) return;

    progressContainer.classList.remove("d-none");
    progressBar.style.width = "0%";

    try {
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        const format = formatSelect.value;

        progressBar.style.width = `${((i + 1) / fileInput.files.length) * 100}%`;

        const parsedLogs = await this.parseLogFile(file, format);
        this.uploadedLogs = this.uploadedLogs.concat(parsedLogs);
      }

      // Merge uploaded logs with mock logs
      this.mockLogs = [...this.uploadedLogs, ...this.mockLogs];
      this.applyFilters();

      // Show success message
      this.showUploadSuccess(fileInput.files.length);
    } catch (error) {
      console.error("Error uploading logs:", error);
      alert("Error processing log files. Please check the format and try again.");
    } finally {
      progressContainer.classList.add("d-none");
      fileInput.value = "";
      document.getElementById("upload-logs-btn").disabled = true;
      uploadBtn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i>Upload & Parse';
    }
  }

  async parseLogFile(file, format) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const parsedLogs = this.parseLogContent(content, format);
        resolve(parsedLogs);
      };
      reader.readAsText(file);
    });
  }

  parseLogContent(content, format) {
    const lines = content.split("\n").filter((line) => line.trim());
    const logs = [];

    lines.forEach((line, index) => {
      try {
        let logEntry;

        switch (format) {
          case "json":
            logEntry = JSON.parse(line);
            break;
          case "csv":
            logEntry = this.parseCSVLine(line, index === 0);
            break;
          case "web":
            logEntry = this.parseWebLogLine(line);
            break;
          default:
            logEntry = this.parseGenericLogLine(line);
        }

        if (logEntry) {
          logs.push({
            id: Date.now() + index,
            timestamp: new Date(logEntry.timestamp || Date.now()),
            eventType: logEntry.eventType || "system",
            source: logEntry.source || logEntry.ip || "Unknown",
            description: logEntry.description || logEntry.message || line.substring(0, 100),
            severity: logEntry.severity || "info",
            statusCode: logEntry.statusCode || logEntry.status || null,
            userAgent: logEntry.userAgent || logEntry.agent || null,
            isUploaded: true,
          });
        }
      } catch (error) {
        console.warn(`Failed to parse line ${index + 1}:`, line);
      }
    });

    return logs;
  }

  parseWebLogLine(line) {
    // Regex pattern for Apache Combined Log Format: host ident authuser [timestamp] "request" status bytes referrer "user-agent"
    const webLogPattern = /(.*?)(?: - -)? \[(.*?)\] "(.*?)" (\d+) (\d+|-)(?: "(.*?)" "(.*?)")?/;
    const match = line.match(webLogPattern);

    if (!match) {
      return null;
    }

    const [, host, timestamp, request, statusCode, bytes, referrer, userAgent] = match;

    // Parse the HTTP request to extract method, URL, and protocol
    const requestMatch = request.match(/(\w+) (.+?) (HTTP\/\d+\.\d+)/);
    let method = "GET";
    let url = "/";
    let protocol = "HTTP/1.0";

    if (requestMatch) {
      [method, url, protocol] = requestMatch.slice(1);
    }

    // Parse timestamp (convert Apache format to ISO)
    let parsedTimestamp;
    try {
      const timestampMatch = timestamp.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
      if (timestampMatch) {
        const [, day, month, year, hour, minute, second] = timestampMatch;
        const monthMap = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
        };
        parsedTimestamp = `${year}-${monthMap[month]}-${day}T${hour}:${minute}:${second}Z`;
      } else {
        parsedTimestamp = new Date().toISOString();
      }
    } catch (error) {
      parsedTimestamp = new Date().toISOString();
    }

    // Determine event type based on status code and request
    let eventType = "system";
    const status = Number.parseInt(statusCode);
    if (status >= 400 && status < 500) {
      eventType = "firewall";
    } else if (status >= 500) {
      eventType = "system";
    } else if (url.includes("login") || url.includes("auth")) {
      eventType = "login";
    }

    // Determine severity based on status code
    let severity = "info";
    if (status >= 500) {
      severity = "high";
    } else if (status >= 400) {
      severity = "medium";
    } else if (status >= 300) {
      severity = "low";
    }

    // Construct description with only the relevant portion
    const description = `"${method} ${url} ${protocol}" ${statusCode} ${bytes === "-" ? "0" : bytes} "${
      referrer || "-"
    }" "${userAgent || "-"}"`;

    return {
      timestamp: parsedTimestamp,
      source: host.trim() || "Unknown", // Accept hostname or IP as source
      statusCode: Number.parseInt(statusCode),
      description: description, // Clean HTTP request and related fields
      eventType: eventType,
      severity: severity,
      userAgent: userAgent || null,
      bytes: bytes === "-" ? 0 : Number.parseInt(bytes),
    };
  }

  parseGenericLogLine(line) {
    // Simple regex to extract common log patterns
    const patterns = [
      /(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/, // ISO timestamp
      /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/, // IP address
      /(\d{3})\s/, // Status code
    ];

    const timestamp = line.match(patterns[0])?.[1];
    const ip = line.match(patterns[1])?.[1];
    const status = line.match(patterns[2])?.[1];

    return {
      timestamp: timestamp || new Date().toISOString(),
      source: ip || "Unknown",
      statusCode: status,
      description: line.substring(0, 200),
      eventType: this.detectEventType(line),
      severity: this.detectSeverity(line),
    };
  }

  detectEventType(line) {
    const lower = line.toLowerCase();
    if (lower.includes("login") || lower.includes("auth")) return "login";
    if (lower.includes("xss") || lower.includes("script")) return "xss";
    if (lower.includes("malware") || lower.includes("virus")) return "malware";
    if (lower.includes("ddos") || lower.includes("flood")) return "ddos";
    if (lower.includes("firewall") || lower.includes("block")) return "firewall";
    return "system";
  }

  detectSeverity(line) {
    const lower = line.toLowerCase();
    if (lower.includes("critical") || lower.includes("error") || lower.includes("fail")) return "high";
    if (lower.includes("warning") || lower.includes("warn")) return "medium";
    if (lower.includes("info") || lower.includes("notice")) return "info";
    return "low";
  }

  showUploadSuccess(fileCount) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-success alert-dismissible fade show mt-3";
    alertDiv.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      Successfully uploaded and parsed ${fileCount} log file(s). ${this.uploadedLogs.length} new entries added.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector(".container");
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  toggleCustomDateRange(show) {
    const customDateRange = document.getElementById("custom-date-range");
    if (customDateRange) {
      if (show) {
        customDateRange.classList.remove("d-none");
      } else {
        customDateRange.classList.add("d-none");
      }
    }
  }

  applyCustomDateRange() {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    if (startDate && endDate) {
      this.filters.startDate = new Date(startDate);
      this.filters.endDate = new Date(endDate);
      this.applyFilters();
    }
  }

  generateMockLogs() {
    const eventTypes = ["login", "xss", "malware", "ddos", "system", "firewall", "intrusion"];
    const severities = ["high", "medium", "low", "info"];
    const sources = [
      "192.168.1.100",
      "10.0.0.50",
      "203.0.113.45",
      "198.51.100.23",
      "Scanner Module",
      "Firewall",
      "System",
    ];
    const statusCodes = [200, 400, 401, 403, 404, 500, null];
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "curl/7.68.0",
      "Python-requests/2.25.1",
      null,
    ];

    const logs = [];

    for (let i = 0; i < 50; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

      logs.push({
        id: i + 1,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        eventType: eventType,
        source: source,
        description: this.generateDescription(eventType),
        severity: severity,
        statusCode: statusCode,
        userAgent: userAgent,
        isUploaded: false,
      });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  generateDescription(eventType) {
    const descriptions = {
      login: "Failed login attempt detected",
      xss: "Cross-site scripting attempt blocked",
      malware: "Malicious file detected and quarantined",
      ddos: "DDoS attack mitigated",
      system: "System security update applied",
      firewall: "Firewall rule triggered",
      intrusion: "Potential intrusion detected",
    };

    return descriptions[eventType] || "Security event detected";
  }

  loadLogs() {
    this.showLoading();

    setTimeout(() => {
      this.renderLogs();
      this.updateLogCount();
      this.renderPagination();
      this.showContent();
    }, 1000);
  }

  showLoading() {
    const loadingEl = document.getElementById("logs-loading");
    const contentEl = document.getElementById("logs-content");
    const emptyEl = document.getElementById("logs-empty");

    if (loadingEl) loadingEl.classList.remove("d-none");
    if (contentEl) contentEl.classList.add("d-none");
    if (emptyEl) emptyEl.classList.add("d-none");
  }

  showContent() {
    const loadingEl = document.getElementById("logs-loading");
    const contentEl = document.getElementById("logs-content");
    const emptyEl = document.getElementById("logs-empty");

    if (loadingEl) loadingEl.classList.add("d-none");

    if (this.filteredLogs.length === 0) {
      if (contentEl) contentEl.classList.add("d-none");
      if (emptyEl) emptyEl.classList.remove("d-none");
    } else {
      if (contentEl) contentEl.classList.remove("d-none");
      if (emptyEl) emptyEl.classList.add("d-none");
    }
  }

  renderLogs() {
    const tbody = document.getElementById("logs-table-body");
    if (!tbody) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageData = this.filteredLogs.slice(startIndex, endIndex);

    tbody.innerHTML = pageData
      .map(
        (log) => `
            <tr class="slide-in ${log.isUploaded ? "table-info" : ""}">
                <td class="text-muted">${this.formatTime(log.timestamp)}</td>
                <td>
                    <span class="badge bg-primary me-2">${this.getEventTypeLabel(log.eventType)}</span>
                    ${log.isUploaded ? '<i class="bi bi-upload text-info" title="Uploaded log"></i>' : ""}
                </td>
                <td>${log.source}</td>
                <td>
                    ${log.statusCode ? `<span class="badge bg-secondary">${log.statusCode}</span>` : '<span class="text-muted">-</span>'}
                </td>
                <td class="text-truncate" style="max-width: 200px;" title="${log.userAgent || "N/A"}">
                    ${log.userAgent ? log.userAgent.substring(0, 30) + "..." : '<span class="text-muted">-</span>'}
                </td>
                <td>${log.description}</td>
                <td>
                    <span class="status-badge status-${log.severity}">${log.severity}</span>
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="window.logsManager.viewLogDetails(${log.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
    const pagination = document.getElementById("logs-pagination");

    if (!pagination) return;

    let paginationHTML = "";

    // Previous button
    paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" onclick="window.logsManager.goToPage(${this.currentPage - 1})">Previous</a>
            </li>
        `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? "active" : ""}">
                        <a class="page-link" href="#" onclick="window.logsManager.goToPage(${i})">${i}</a>
                    </li>
                `;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    // Next button
    paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? "disabled" : ""}">
                <a class="page-link" href="#" onclick="window.logsManager.goToPage(${this.currentPage + 1})">Next</a>
            </li>
        `;

    pagination.innerHTML = paginationHTML;

    // Update showing info
    const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredLogs.length);

    const showingStart = document.getElementById("showing-start");
    const showingEnd = document.getElementById("showing-end");
    const totalLogs = document.getElementById("total-logs");

    if (showingStart) showingStart.textContent = startIndex;
    if (showingEnd) showingEnd.textContent = endIndex;
    if (totalLogs) totalLogs.textContent = this.filteredLogs.length;
  }

  updateLogCount() {
    const logCount = document.getElementById("log-count");
    if (logCount) {
      logCount.textContent = `${this.filteredLogs.length} events`;
    }
  }

  applyFilters() {
    this.filteredLogs = this.mockLogs.filter((log) => {
      let matches = true;

      if (this.filters.severity && log.severity !== this.filters.severity) {
        matches = false;
      }

      if (this.filters.eventType && log.eventType !== this.filters.eventType) {
        matches = false;
      }

      if (this.filters.searchText) {
        const searchLower = this.filters.searchText.toLowerCase();
        const searchableText = `${log.description} ${log.source} ${log.eventType} ${log.userAgent || ""}`.toLowerCase();
        if (!searchableText.includes(searchLower)) {
          matches = false;
        }
      }

      if (this.filters.sourceIP) {
        const sourceLower = log.source.toLowerCase();
        const filterLower = this.filters.sourceIP.toLowerCase();
        if (!sourceLower.includes(filterLower)) {
          matches = false;
        }
      }

      if (this.filters.statusCode && log.statusCode != this.filters.statusCode) {
        matches = false;
      }

      // Custom date range filtering
      if (this.filters.startDate && this.filters.endDate) {
        if (log.timestamp < this.filters.startDate || log.timestamp > this.filters.endDate) {
          matches = false;
        }
      }

      return matches;
    });

    this.currentPage = 1;
    this.loadLogs();
  }

  clearFilters() {
    this.filters = {
      severity: "",
      eventType: "",
      dateRange: "today",
      searchText: "",
      sourceIP: "",
      statusCode: "",
      startDate: null,
      endDate: null,
    };

    // Reset form controls
    const severityFilter = document.getElementById("severity-filter");
    const eventTypeFilter = document.getElementById("event-type-filter");
    const dateFilter = document.getElementById("date-filter");
    const searchInput = document.getElementById("search-logs");
    const ipFilter = document.getElementById("ip-filter");
    const statusFilter = document.getElementById("status-filter");

    if (severityFilter) severityFilter.value = "";
    if (eventTypeFilter) eventTypeFilter.value = "";
    if (dateFilter) dateFilter.value = "today";
    if (searchInput) searchInput.value = "";
    if (ipFilter) ipFilter.value = "";
    if (statusFilter) statusFilter.value = "";

    this.toggleCustomDateRange(false);
    this.applyFilters();
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);

    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderLogs();
      this.renderPagination();
    }
  }

  refreshLogs() {
    const refreshBtn = document.getElementById("refresh-logs");
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refreshing...';
      refreshBtn.disabled = true;
    }

    // Simulate new logs
    this.mockLogs = this.generateMockLogs();
    this.applyFilters();

    setTimeout(() => {
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refresh Logs';
        refreshBtn.disabled = false;
      }
    }, 1000);
  }

  viewLogDetails(logId) {
    const log = this.mockLogs.find((l) => l.id === logId);
    if (log) {
      alert(
        `Log Details:\n\nID: ${log.id}\nTimestamp: ${log.timestamp}\nType: ${log.eventType}\nSeverity: ${log.severity}\nSource: ${log.source}\nDescription: ${log.description}\nStatus Code: ${log.statusCode}\nUser Agent: ${log.userAgent || "N/A"}`,
      );
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  getEventTypeLabel(eventType) {
    const labels = {
      login: "Login",
      xss: "XSS",
      malware: "Malware",
      ddos: "DDoS",
      system: "System",
      firewall: "Firewall",
      intrusion: "Intrusion",
    };

    return labels[eventType] || eventType.toUpperCase();
  }
}

// Initialize logs manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("logs-table")) {
    window.logsManager = new LogsManager();
  }
});
