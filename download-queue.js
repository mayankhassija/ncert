/**
 * Book Download Queue Manager
 * Handles sequential downloads with rate limiting and pause/resume capability
 */

class BookDownloadQueue {
  constructor(options = {}) {
    this.queue = [];
    this.isRunning = false;
    this.isPaused = false;
    this.delayMs = options.delayMs || 3000; // 3 seconds between requests
    this.currentIndex = 0;
    this.completed = [];
    this.failed = [];
    this.listeners = {};
  }

  // ── Event System ──
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // ── Queue Management ──
  addBooks(books) {
    this.queue = books.map((b, idx) => ({
      ...b,
      id: idx,
      status: 'pending' // pending | downloading | completed | failed
    }));
    this.currentIndex = 0;
    this.completed = [];
    this.failed = [];
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.emit('start', { total: this.queue.length });

    // Restore from localStorage if resuming
    const savedState = this.getSavedState();
    if (savedState && savedState.currentIndex > 0) {
      this.currentIndex = savedState.currentIndex;
      this.completed = savedState.completed;
      this.failed = savedState.failed;
    }

    for (let i = this.currentIndex; i < this.queue.length; i++) {
      if (!this.isRunning) break; // Stop if paused/cancelled

      this.currentIndex = i;
      const book = this.queue[i];
      book.status = 'downloading';

      this.emit('progress', {
        current: i + 1,
        total: this.queue.length,
        completed: this.completed.length,
        failed: this.failed.length,
        currentBook: book
      });

      try {
        await this.downloadBook(book);
        this.completed.push(book.book_code);
        book.status = 'completed';
        console.log(`✓ Download queued: ${book.title}`);
      } catch (err) {
        console.error(`✗ Failed to download ${book.title}:`, err);
        this.failed.push({ code: book.book_code, title: book.title, error: err.message });
        book.status = 'failed';
      }

      // Save state
      this.saveState();

      // Rate limiting - wait before next download
      if (i < this.queue.length - 1) {
        await this.delay(this.delayMs);
      }
    }

    this.isRunning = false;
    this.emit('complete', {
      total: this.queue.length,
      completed: this.completed.length,
      failed: this.failed.length
    });

    // Clear saved state on completion
    localStorage.removeItem('ncert_download_queue_state');
  }

  async downloadBook(book) {
    const zipUrl = `https://ncert.nic.in/textbook/pdf/${book.book_code}dd.zip`;

    return new Promise((resolve, reject) => {
      try {
        // Use native download method (like the individual download buttons)
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `${book.book_code}dd.zip`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Wait to ensure browser has initiated the download before resolving
        setTimeout(() => resolve(), 500);
      } catch (err) {
        reject(new Error(`Download initiation failed: ${err.message}`));
      }
    });
  }

  pause() {
    this.isRunning = false;
    this.isPaused = true;
    this.saveState();
    this.emit('pause', { currentIndex: this.currentIndex });
  }

  resume() {
    this.start();
  }

  cancel() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.completed = [];
    this.failed = [];
    localStorage.removeItem('ncert_download_queue_state');
    this.emit('cancel', {});
  }

  // ── Persistence ──
  saveState() {
    const state = {
      currentIndex: this.currentIndex,
      completed: this.completed,
      failed: this.failed,
      queueLength: this.queue.length,
      timestamp: Date.now()
    };
    localStorage.setItem('ncert_download_queue_state', JSON.stringify(state));
  }

  getSavedState() {
    const saved = localStorage.getItem('ncert_download_queue_state');
    return saved ? JSON.parse(saved) : null;
  }

  // ── Utilities ──
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      total: this.queue.length,
      completed: this.completed.length,
      failed: this.failed.length,
      percentage: this.queue.length > 0 ? Math.round((this.currentIndex / this.queue.length) * 100) : 0
    };
  }

  // ── Restore resume state on page load ──
  checkForResumableState() {
    const saved = this.getSavedState();
    return saved && saved.queueLength > 0 && Date.now() - saved.timestamp < 86400000; // 24 hours
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BookDownloadQueue;
}
