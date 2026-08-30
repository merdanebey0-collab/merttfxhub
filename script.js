let presets = JSON.parse(localStorage.getItem('mertfx_presets')) || [];
let currentUser = localStorage.getItem('mertfx_active_user') || null;
let isRegisterMode = false;

let activeCategory = 'all';
let searchQuery = '';

const navAuthSection = document.getElementById('navAuthSection');
const assetGrid = document.getElementById('assetGrid');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

const authModal = document.getElementById('authModal');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthModeBtn = document.getElementById('toggleAuthModeBtn');
const authToggleText = document.getElementById('authToggleText');

const uploadModal = document.getElementById('uploadModal');
const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
const presetUploadForm = document.getElementById('presetUploadForm');

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  renderAssets();
});

function renderNav() {
  if (currentUser) {
    navAuthSection.innerHTML = `
      <span class="user-badge"><i class="fa-solid fa-user"></i> ${currentUser}</span>
      <button class="btn-nav btn-primary" id="openUploadModalBtn"><i class="fa-solid fa-plus"></i> Preset Yükle</button>
      <button class="btn-nav" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i></button>
    `;
    document.getElementById('openUploadModalBtn').addEventListener('click', () => uploadModal.classList.add('active'));
  } else {
    navAuthSection.innerHTML = `
      <button class="btn-nav btn-primary" onclick="openAuthModal()"><i class="fa-solid fa-user"></i> Giriş Yap / Kayıt Ol</button>
    `;
  }
}

function openAuthModal() {
  isRegisterMode = false;
  updateAuthUI();
  authModal.classList.add('active');
}

closeAuthModalBtn.addEventListener('click', () => authModal.classList.remove('active'));
closeUploadModalBtn.addEventListener('click', () => uploadModal.classList.remove('active'));

toggleAuthModeBtn.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  updateAuthUI();
});

function updateAuthUI() {
  if (isRegisterMode) {
    authTitle.textContent = "Kayıt Ol";
    authSubmitBtn.textContent = "Kayıt Ol";
    authToggleText.textContent = "Zaten hesabın var mı?";
    toggleAuthModeBtn.textContent = "Giriş Yap";
  } else {
    authTitle.textContent = "Giriş Yap";
    authSubmitBtn.textContent = "Giriş Yap";
    authToggleText.textContent = "Hesabın yok mu?";
    toggleAuthModeBtn.textContent = "Kayıt Ol";
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value.trim();

  let users = JSON.parse(localStorage.getItem('mertfx_registered_users')) || {};

  if (isRegisterMode) {
    if (users[username]) {
      alert("Bu kullanıcı adı zaten alınmış!");
      return;
    }
    users[username] = password;
    localStorage.setItem('mertfx_registered_users', JSON.stringify(users));
    currentUser = username;
    localStorage.setItem('mertfx_active_user', currentUser);
    alert("Kayıt başarılı!");
  } else {
    if (!users[username] || users[username] !== password) {
      alert("Kullanıcı adı veya şifre hatalı!");
      return;
    }
    currentUser = username;
    localStorage.setItem('mertfx_active_user', currentUser);
  }

  authForm.reset();
  authModal.classList.remove('active');
  renderNav();
});

function logout() {
  localStorage.removeItem('mertfx_active_user');
  currentUser = null;
  renderNav();
}

// Dosya Seçme ve Yükleme Mantığı
presetUploadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('inputTitle').value;
  const category = document.getElementById('selectCategory').value;
  const description = document.getElementById('inputDesc').value;
  const fileInput = document.getElementById('inputFile');
  const file = fileInput.files[0];

  if (!file) {
    alert("Lütfen bir dosya seçin!");
    return;
  }

  const categoryNames = { ae: "After Effects", am: "Alight Motion", nv: "Node Video" };
  const fileName = file.name;
  const fileExtension = '.' + fileName.split('.').pop();

  const reader = new FileReader();
  reader.onload = function(event) {
    const fileBase64 = event.target.result;

    const newPreset = {
      id: Date.now(),
      title: title,
      category: category,
      categoryName: categoryNames[category],
      description: description,
      format: fileExtension,
      fileName: fileName,
      fileData: fileBase64,
      author: currentUser || "Anonim",
      downloads: 0
    };

    presets.unshift(newPreset);

    try {
      localStorage.setItem('mertfx_presets', JSON.stringify(presets));
    } catch (err) {
      alert("Dosya boyutu yüksek olduğu için tarayıcı belleğine kaydedilemedi. Lütfen daha küçük bir dosya seçin.");
      return;
    }

    renderAssets();
    presetUploadForm.reset();
    uploadModal.classList.remove('active');
    alert("Preset dosyası başarıyla yüklendi!");
  };

  reader.readAsDataURL(file);
});

function renderAssets() {
  assetGrid.innerHTML = '';

  const filtered = presets.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    assetGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
        <p>Henüz yüklenmiş bir preset bulunmuyor.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="card-tag">${item.categoryName}</span>
          <span class="card-author"><i class="fa-solid fa-user"></i> ${item.author}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
      <button class="download-btn" onclick="downloadPreset(${item.id})">
        <i class="fa-solid fa-download"></i> İndir (${item.format})
      </button>
    `;
    assetGrid.appendChild(card);
  });
}

// Gerçek Dosyayı İndirme Mantığı
function downloadPreset(id) {
  const item = presets.find(p => p.id === id);
  if (item && item.fileData) {
    item.downloads += 1;
    localStorage.setItem('mertfx_presets', JSON.stringify(presets));

    const a = document.createElement('a');
    a.href = item.fileData;
    a.download = item.fileName || `${item.title}${item.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    renderAssets();
  } else {
    alert("Dosya verisi bulunamadı!");
  }
}

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderAssets();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    filterBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.getAttribute('data-category');
    renderAssets();
  });
});