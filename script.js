const BASE_URL = 'https://ncert.nic.in/textbook/pdf/';

// ── DOM ──
const searchInput = document.getElementById('searchInput');
const classFilter = document.getElementById('classFilter');
const subjectFilter = document.getElementById('subjectFilter');
const clearBtn = document.getElementById('clearBtn');
const bookContainer = document.getElementById('bookContainer');
const resultCount = document.getElementById('resultCount');
const errorMessage = document.getElementById('errorMessage');
const feedback = document.getElementById('feedback');
const quickJump = document.getElementById('quickJump');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const backToTop = document.getElementById('backToTop');
const toast = document.getElementById('toast');
const bookmarkToggle = document.getElementById('bookmarkToggle');
const bookmarkPanel = document.getElementById('bookmarkPanel');
const panelClose = document.getElementById('panelClose');
const bookmarkList = document.getElementById('bookmarkList');
const bmCount = document.getElementById('bmCount');

const totalBooksEl = document.getElementById('totalBooks');

let books = [];
let viewMode = 'grid'; // 'grid' | 'list'
let bookmarks = JSON.parse(localStorage.getItem('ncert_bookmarks') || '[]');

// ── Load ──
async function loadBooks() {
  try {
    const res = await fetch('books.json');
    if (!res.ok) throw new Error();
    books = await res.json();
    totalBooksEl.textContent = books.length;
    renderFilters();
    applyFilters();
  } catch {
    showError('Could not load books.json. Open this page through a local web server (e.g. Live Server in VS Code) to allow the browser to fetch the data file.');
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
  resultCount.textContent = 'No books available.';
}

// ── Filters ──
function renderFilters() {
  const classes = [...new Set(books.map(b => b.class))].sort((a, b) => a - b);
  classes.forEach(cls => {
    const o = document.createElement('option');
    o.value = cls; o.textContent = `Class ${cls}`;
    classFilter.appendChild(o);
  });

  updateSubjectFilter();

  // Quick Jump chips (Grouped)
  const categories = [
    { name: 'Primary', range: [1, 5] },
    { name: 'Middle', range: [6, 8] },
    { name: 'Secondary', range: [9, 10] },
    { name: 'Senior Sec.', range: [11, 12] }
  ];

  categories.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'jump-group';

    const label = document.createElement('span');
    label.className = 'jump-label';
    label.textContent = cat.name;
    group.appendChild(label);

    const links = document.createElement('div');
    links.className = 'jump-links';

    classes.filter(cls => cls >= cat.range[0] && cls <= cat.range[1]).forEach(cls => {
      const chip = document.createElement('a');
      chip.className = 'jump-chip';
      chip.textContent = cls; // Just the number to keep it compact
      chip.href = `#class-${cls}`;
      links.appendChild(chip);
    });

    group.appendChild(links);
    quickJump.appendChild(group);
  });
}

function updateSubjectFilter() {
  const selCls = classFilter.value;
  const currentSubject = subjectFilter.value;
  
  // Clear current subjects except the first one (All Subjects)
  subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
  
  const relevantBooks = selCls === 'all' 
    ? books 
    : books.filter(b => String(b.class) === selCls);
    
  const subjects = [...new Set(relevantBooks.map(b => b.subject))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  
  subjects.forEach(sub => {
    const o = document.createElement('option');
    o.value = sub; o.textContent = sub;
    subjectFilter.appendChild(o);
  });
  
  // Keep the selected subject if it's still available in the new class
  if (subjects.includes(currentSubject)) {
    subjectFilter.value = currentSubject;
  }
}

// ── Apply Filters ──
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const selCls = classFilter.value;
  const selSub = subjectFilter.value;
  const hasFilter = query || selCls !== 'all' || selSub !== 'all';
  clearBtn.classList.toggle('hidden', !hasFilter);

  const filtered = books.filter(b => {
    const mText = b.title.toLowerCase().includes(query) || b.subject.toLowerCase().includes(query);
    const mClass = selCls === 'all' || String(b.class) === selCls;
    const mSubject = selSub === 'all' || b.subject === selSub;
    return mText && mClass && mSubject;
  });

  bookContainer.innerHTML = '';

  if (!filtered.length) {
    bookContainer.innerHTML = `
          <div class="empty-state">
            <div class="icon">📭</div>
            <h3>No books found</h3>
            <p>Try a different keyword, class, or subject.</p>
          </div>`;
    resultCount.textContent = 'No books match your filters.';
    feedback.textContent = '';
    return;
  }

  // Group by class and then by subject
  const grouped = {};
  filtered.forEach(b => {
    if (!grouped[b.class]) grouped[b.class] = {};
    if (!grouped[b.class][b.subject]) grouped[b.class][b.subject] = [];
    grouped[b.class][b.subject].push(b);
  });

  Object.keys(grouped).sort((a, b) => a - b).forEach(cls => {
    const classSection = document.createElement('section');
    classSection.className = 'class-group';
    classSection.setAttribute('aria-labelledby', `heading-class-${cls}`);

    const classHeading = document.createElement('div');
    classHeading.className = 'class-heading';
    classHeading.id = `class-${cls}`;

    // Calculate total books in this class
    const classBooksCount = Object.values(grouped[cls]).reduce((sum, list) => sum + list.length, 0);

    classHeading.innerHTML = `
          <h2 id="heading-class-${cls}">Class ${cls}</h2>
          <span class="class-count">${classBooksCount} book${classBooksCount !== 1 ? 's' : ''}</span>
          <button class="class-bookmark-btn" data-class="${cls}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; padding: 4px 8px; margin-left: auto; transition: color var(--transition);" aria-label="Save all Class ${cls} books" title="Save/Remove all books in this class">☆</button>
        `;
    classSection.appendChild(classHeading);

    // Add event listener for class bookmark button
    const classBookmarkBtn = classHeading.querySelector('.class-bookmark-btn');
    const booksInClass = Object.values(grouped[cls]).flat();
    const allSaved = booksInClass.every(b => bookmarks.includes(b.book_code));
    
    if (allSaved) {
      classBookmarkBtn.textContent = '★';
      classBookmarkBtn.style.color = 'var(--accent)';
    }
    
    classBookmarkBtn.addEventListener('click', () => {
      const allBookCodesInClass = booksInClass.map(b => b.book_code);
      const allCurrentlySaved = allBookCodesInClass.every(code => bookmarks.includes(code));
      
      if (allCurrentlySaved) {
        // Remove all books in this class
        allBookCodesInClass.forEach(code => {
          const idx = bookmarks.indexOf(code);
          if (idx !== -1) bookmarks.splice(idx, 1);
        });
        classBookmarkBtn.textContent = '☆';
        classBookmarkBtn.style.color = 'var(--text-muted)';
        showToast(`Removed all Class ${cls} books`);
      } else {
        // Add all books in this class
        allBookCodesInClass.forEach(code => {
          if (!bookmarks.includes(code)) bookmarks.push(code);
        });
        classBookmarkBtn.textContent = '★';
        classBookmarkBtn.style.color = 'var(--accent)';
        showToast(`Saved all Class ${cls} books`);
      }
      
      localStorage.setItem('ncert_bookmarks', JSON.stringify(bookmarks));
      updateBmCount();
      renderBookmarkPanel();
      applyFilters(); // re-render cards to update star state
    });

    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'subjects-container';

    // Group by subject within the class
    Object.keys(grouped[cls]).sort().forEach(sub => {
      const subjectGroup = document.createElement('div');
      subjectGroup.className = 'subject-group';

      const subjectSubheading = document.createElement('h3');
      subjectSubheading.className = 'subject-subheading';
      subjectSubheading.textContent = sub;
      subjectGroup.appendChild(subjectSubheading);

      const grid = document.createElement('div');
      grid.className = `grid${viewMode === 'list' ? ' list-view' : ''}`;

      grouped[cls][sub].forEach(book => grid.appendChild(buildCard(book)));
      subjectGroup.appendChild(grid);
      subjectsContainer.appendChild(subjectGroup);
    });

    classSection.appendChild(subjectsContainer);
    bookContainer.appendChild(classSection);
  });

  resultCount.innerHTML = `<strong>${filtered.length}</strong> book${filtered.length !== 1 ? 's' : ''} found`;
  feedback.textContent = `${books.length} total`;
}

// ── Card ──
function buildCard(book) {
  const el = document.createElement('article');
  el.className = 'card';
  el.setAttribute('role', 'listitem');

  const isBm = bookmarks.includes(book.book_code);

    el.innerHTML = `
        <button class="bookmark-btn ${isBm ? 'active' : ''}" data-code="${book.book_code}" aria-label="${isBm ? 'Remove bookmark' : 'Bookmark'} ${book.title}" title="Bookmark">${isBm ? '★' : '☆'}</button>
        <h2>${book.title}</h2>
        <div class="actions">
          <a class="btn btn-primary" href="${BASE_URL}${book.book_code}dd.zip" target="_blank" rel="noopener noreferrer" aria-label="Download ZIP for ${book.title}">⬇ Download ZIP</a>
          <a class="btn btn-ghost" href="${BASE_URL}${book.book_code}ps.pdf" target="_blank" rel="noopener noreferrer" aria-label="Preview PDF for ${book.title}">👁 Preview</a>
        </div>`;

  // Bookmark
  el.querySelector('.bookmark-btn').addEventListener('click', () => toggleBookmark(book));


  return el;
}

// ── Bookmarks ──
function toggleBookmark(book) {
  const idx = bookmarks.indexOf(book.book_code);
  if (idx === -1) {
    bookmarks.push(book.book_code);
    showToast(`Saved: ${book.title}`);
  } else {
    bookmarks.splice(idx, 1);
    showToast(`Removed: ${book.title}`);
  }
  localStorage.setItem('ncert_bookmarks', JSON.stringify(bookmarks));
  updateBmCount();
  renderBookmarkPanel();
  applyFilters(); // re-render cards to update star state
}

function updateBmCount() {
  bmCount.textContent = bookmarks.length;
}

function renderBookmarkPanel() {
  bookmarkList.innerHTML = '';
  if (!bookmarks.length) {
    bookmarkList.innerHTML = `
      <div class="bookmark-empty">
        <div class="bookmark-empty-icon">✨</div>
        <div class="bookmark-empty-text">Your collection is empty</div>
        <div class="bookmark-empty-hint">Click <span>☆</span> on any book card<br>to save it here.</div>
      </div>`;
    return;
  }
  bookmarks.forEach(code => {
    const book = books.find(b => b.book_code === code);
    if (!book) return;
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <h3 style="margin: 0; flex: 1;">${book.title}</h3>
            <button class="bookmark-remove-btn" data-code="${book.book_code}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; padding: 0; flex-shrink: 0;" aria-label="Remove ${book.title}" title="Remove from saved">★</button>
          </div>
          <div class="actions">
            <a class="btn btn-primary" href="${BASE_URL}${book.book_code}dd.zip" target="_blank" rel="noopener" style="font-size:0.8rem;padding:8px 12px;">⬇ ZIP</a>
            <a class="btn btn-ghost" href="${BASE_URL}${book.book_code}ps.pdf" target="_blank" rel="noopener" style="font-size:0.8rem;padding:8px 12px;">👁 PDF</a>
          </div>`;
    
    // Add remove functionality
    item.querySelector('.bookmark-remove-btn').addEventListener('click', () => {
      toggleBookmark(book);
    });
    
    bookmarkList.appendChild(item);
  });
}

// ── Toast ──
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── View Toggle ──
gridViewBtn.addEventListener('click', () => {
  viewMode = 'grid';
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  gridViewBtn.setAttribute('aria-pressed', 'true');
  listViewBtn.setAttribute('aria-pressed', 'false');
  applyFilters();
});
listViewBtn.addEventListener('click', () => {
  viewMode = 'list';
  listViewBtn.classList.add('active');
  gridViewBtn.classList.remove('active');
  listViewBtn.setAttribute('aria-pressed', 'true');
  gridViewBtn.setAttribute('aria-pressed', 'false');
  applyFilters();
});

// ── Clear Filters ──
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  classFilter.value = 'all';
  subjectFilter.value = 'all'; // Explicit reset
  updateSubjectFilter();
  applyFilters();
});

// ── Bookmark Panel ──
bookmarkToggle.addEventListener('click', () => {
  bookmarkPanel.classList.toggle('open');
  renderBookmarkPanel();
});
panelClose.addEventListener('click', () => bookmarkPanel.classList.remove('open'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') bookmarkPanel.classList.remove('open');
});

// ── Download All Functionality ──
const downloadModal = document.getElementById('downloadModal');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadModalClose = document.getElementById('downloadModalClose');
const downloadPauseBtn = document.getElementById('downloadPauseBtn');
const downloadResumeBtn = document.getElementById('downloadResumeBtn');
const downloadCancelBtn = document.getElementById('downloadCancelBtn');
const downloadCloseBtn = document.getElementById('downloadCloseBtn');
const downloadCurrentBook = document.getElementById('downloadCurrentBook');
const downloadProgressFill = document.getElementById('downloadProgressFill');
const downloadCount = document.getElementById('downloadCount');
const downloadPercentage = document.getElementById('downloadPercentage');
const downloadCompleted = document.getElementById('downloadCompleted');
const downloadFailed = document.getElementById('downloadFailed');
const downloadFailedList = document.getElementById('downloadFailedList');
const failedBooksContainer = document.getElementById('failedBooksContainer');

let downloadQueue = null;

function initializeDownloadQueue() {
  downloadQueue = new BookDownloadQueue({ delayMs: 10000 }); // 10 seconds between downloads

  // Event: Start
  downloadQueue.on('start', (data) => {
    openDownloadModal();
    downloadPauseBtn.style.display = 'block';
    downloadResumeBtn.style.display = 'none';
    downloadCancelBtn.style.display = 'block';
    downloadCloseBtn.style.display = 'none';
    showToast('📥 Starting download queue...');
  });

  // Event: Progress
  downloadQueue.on('progress', (data) => {
    downloadCurrentBook.textContent = `📖 ${data.currentBook.title}`;
    downloadCount.textContent = `${data.current} / ${data.total}`;
    downloadPercentage.textContent = `${Math.round((data.current / data.total) * 100)}%`;
    downloadProgressFill.style.width = `${(data.current / data.total) * 100}%`;
    downloadCompleted.textContent = data.completed;
    downloadFailed.textContent = data.failed;
  });

  // Event: Complete
  downloadQueue.on('complete', (data) => {
    downloadPauseBtn.style.display = 'none';
    downloadResumeBtn.style.display = 'none';
    downloadCancelBtn.style.display = 'none';
    downloadCloseBtn.style.display = 'block';
    
    let summary = `✅ Download complete! ${data.completed}/${data.total} books downloaded`;
    if (data.failed > 0) {
      summary += ` (${data.failed} failed)`;
      downloadFailedList.style.display = 'block';
    }
    showToast(summary);
  });

  // Event: Pause
  downloadQueue.on('pause', () => {
    downloadPauseBtn.style.display = 'none';
    downloadResumeBtn.style.display = 'block';
    showToast('⏸ Download paused. Click Resume to continue.');
  });

  // Event: Cancel
  downloadQueue.on('cancel', () => {
    downloadModal.classList.remove('open');
    showToast('✕ Download cancelled.');
  });
}

function openDownloadModal() {
  downloadModal.classList.add('open');
  downloadModal.setAttribute('aria-hidden', 'false');
}

function closeDownloadModal() {
  downloadModal.classList.remove('open');
  downloadModal.setAttribute('aria-hidden', 'true');
}

downloadAllBtn.addEventListener('click', () => {
  if (bookmarks.length === 0) {
    showToast('⚠️ No saved books. Add some bookmarks first!');
    return;
  }

  if (!downloadQueue) initializeDownloadQueue();

  // Check if there's a saved state and offer resume
  const savedState = downloadQueue.getSavedState();
  if (savedState && savedState.currentIndex > 0 && savedState.queueLength > 0) {
    const confirmed = confirm(
      `You have a previous download in progress (${savedState.currentIndex}/${savedState.queueLength} books).\n\nWould you like to resume?`
    );
    if (!confirmed) {
      downloadQueue.cancel();
    }
  }

  // Get only bookmarked books
  const bookmarkedBooks = books.filter(b => bookmarks.includes(b.book_code));
  downloadQueue.addBooks(bookmarkedBooks);
  downloadQueue.start();
});

downloadModalClose.addEventListener('click', closeDownloadModal);

downloadPauseBtn.addEventListener('click', () => {
  downloadQueue.pause();
});

downloadResumeBtn.addEventListener('click', () => {
  downloadQueue.resume();
});

downloadCancelBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to cancel the download?')) {
    downloadQueue.cancel();
  }
});

downloadCloseBtn.addEventListener('click', closeDownloadModal);

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && downloadModal.classList.contains('open')) {
    closeDownloadModal();
  }
});


// ── Back to Top ──
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Search / Filter Events ──
searchInput.addEventListener('input', applyFilters);
classFilter.addEventListener('change', () => {
  updateSubjectFilter();
  applyFilters();
});
subjectFilter.addEventListener('change', applyFilters);

// ── URL param support ── (?q=math)
const urlParams = new URLSearchParams(location.search);
if (urlParams.get('q')) searchInput.value = urlParams.get('q');

// ── Init ──
updateBmCount();
loadBooks();
