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
        `;
    classSection.appendChild(classHeading);

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
    bookmarkList.innerHTML = '<div class="bookmark-empty">No saved books yet.<br>Click ☆ on any card to save.</div>';
    return;
  }
  bookmarks.forEach(code => {
    const book = books.find(b => b.book_code === code);
    if (!book) return;
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.innerHTML = `
          <h3>${book.title}</h3>
          <div class="actions">
            <a class="btn btn-primary" href="${BASE_URL}${book.book_code}dd.zip" target="_blank" rel="noopener" style="font-size:0.8rem;padding:8px 12px;">⬇ ZIP</a>
            <a class="btn btn-ghost" href="${BASE_URL}${book.book_code}ps.pdf" target="_blank" rel="noopener" style="font-size:0.8rem;padding:8px 12px;">👁 PDF</a>
          </div>`;
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
