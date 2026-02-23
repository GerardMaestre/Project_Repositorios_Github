// --- CONSTANTES ---
const USERNAME = 'Gmdrax';
const ITEMS_PER_PAGE = 9;
const CACHE_KEY_USER = `gh_user_${USERNAME}`;
const CACHE_KEY_REPOS = `gh_repos_${USERNAME}`;
const CACHE_KEY_TIME = `gh_time_${USERNAME}`;
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutos en milisegundos

// Clases semánticas para botones de filtro
const FILTER_BTN_INACTIVE = 'filter-btn';
const FILTER_BTN_ACTIVE = 'filter-btn filter-btn--active';
const FILTER_BTN_ALL_ACTIVE = 'filter-btn filter-btn--active';

// Constantes de colores de lenguajes
const LANG_COLORS = {
    'JavaScript': '#facc15',
    'TypeScript': '#3b82f6',
    'Python': '#22c55e',
    'HTML': '#f97316',
    'CSS': '#3b82f6',
    'Vue': '#42b883',
    'React': '#61dafb',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C#': '#178600',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Swift': '#ffac45',
    'Kotlin': '#A97BFF'
};

// --- VARIABLES DE ESTADO ---
let allRepos = [];
let filteredRepos = [];
let currentLangFilter = 'all';
let visibleCount = ITEMS_PER_PAGE;
let currentSort = 'updated'; // 'updated', 'stars', 'forks', 'name'

// Session cache for file tree and file content
const sessionCache = {
    trees: new Map(),
    files: new Map()
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Initialize theme
    initTheme();
    
    initApp();

    // Listeners
    document.getElementById('load-more-btn').addEventListener('click', () => {
        visibleCount += ITEMS_PER_PAGE;
        renderRepos(filteredRepos, true);
    });

    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        handleSearch(e.target.value);
    }, 300));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeyboard);
    
    // Scroll to top button
    const scrollBtn = document.getElementById('scroll-to-top');
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Show/hide scroll to top button with debounce
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.scrollY > 300) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.pointerEvents = 'auto';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.pointerEvents = 'none';
            }
        }, 100);
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);
});

// --- GESTIÓN DE CACHÉ ---
function getCachedData() {
    try {
        const timestamp = localStorage.getItem(CACHE_KEY_TIME);
        const user = localStorage.getItem(CACHE_KEY_USER);
        const repos = localStorage.getItem(CACHE_KEY_REPOS);

        if (!timestamp || !user || !repos) return null;

        const now = new Date().getTime();
        // Si la caché es reciente (menos de 60 min), úsala
        if (now - parseInt(timestamp) < CACHE_DURATION) {
            return { user: JSON.parse(user), repos: JSON.parse(repos) };
        }
        return null; // Caché expirada, intentar fetch
    } catch (e) {
        console.warn('Error al leer caché, limpiando datos corruptos:', e);
        clearCache();
        return null;
    }
}

function saveToCache(user, repos) {
    try {
        localStorage.setItem(CACHE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(CACHE_KEY_REPOS, JSON.stringify(repos));
        localStorage.setItem(CACHE_KEY_TIME, new Date().getTime().toString());
    } catch (e) {
        console.warn('Storage lleno', e);
    }
}

function getExpiredCache() {
    // Fallback: Recuperar datos viejos si la API falla
    try {
        const user = localStorage.getItem(CACHE_KEY_USER);
        const repos = localStorage.getItem(CACHE_KEY_REPOS);
        if (user && repos) {
            return { user: JSON.parse(user), repos: JSON.parse(repos) };
        }
        return null;
    } catch (e) {
        console.warn('Error al parsear caché expirada:', e);
        clearCache();
        return null;
    }
}

function clearCache() {
    try {
        localStorage.removeItem(CACHE_KEY_USER);
        localStorage.removeItem(CACHE_KEY_REPOS);
        localStorage.removeItem(CACHE_KEY_TIME);
    } catch (e) {
        console.warn('Error al limpiar caché:', e);
    }
}

function forceRefreshData() {
    clearCache();
    location.reload();
}

// --- LÓGICA PRINCIPAL BLINDADA ---
async function initApp() {
    updateLoadingStatus('Conectando con GitHub...');
    
    let user, repos;
    let dataSource = 'api'; 
    
    try {
        // 1. INTENTAR CACHÉ DEL NAVEGADOR
        const cached = getCachedData();

        if (cached) {
            updateLoadingStatus('Cargando desde caché...');
            console.log('📦 Datos cargados desde caché del navegador');
            dataSource = 'cache';
            user = cached.user;
            repos = cached.repos;
        } else {
            // 2. INTENTAR API DE GITHUB
            try {
                updateLoadingStatus('Consultando API GitHub...');
                const [userRes, reposRes] = await Promise.all([
                    fetch(`https://api.github.com/users/${USERNAME}`),
                    fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`)
                ]);

                if (userRes.status === 403 || reposRes.status === 403) throw new Error('API_LIMIT');
                if (!userRes.ok) throw new Error('Error API');

                user = await userRes.json();
                repos = await reposRes.json();
                saveToCache(user, repos);
                console.log('✅ Datos obtenidos de la API');

            } catch (apiError) {
                console.warn('⚠️ Fallo la API, intentando database.json local...');
                
                // 3. FALLBACK: CARGAR DATABASE.JSON (Lo que faltaba)
                const localRes = await fetch('./database.json');
                if (!localRes.ok) throw new Error('No se pudo cargar database.json local');
                
                const localData = await localRes.json();
                user = localData.user;
                repos = localData.repos;
                dataSource = 'fallback'; // Indica que usamos el archivo local
            }
        }
        
        updateLoadingStatus('Preparando interfaz...');
        processData(user, repos, dataSource);
        hideLoading();

    } catch (error) {
        console.error('Error crítico:', error);
        
        // Último recurso: Caché expirada
        const expiredData = getExpiredCache();
        if (expiredData) {
            showToast('Modo Offline', 'Usando datos antiguos guardados', 'warning');
            try {
                processData(expiredData.user, expiredData.repos, 'fallback');
                hideLoading();
            } catch (e2) {
                console.error('Error en fallback processData:', e2);
                showError('Error al procesar datos: ' + e2.message);
            }
        } else {
            showError('No se pudieron cargar los datos. Verifica tu conexión o espera unos minutos.');
        }
    }
}

function updateLoadingStatus(message) {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function processData(user, repos, dataSource = 'api') {
    allRepos = repos;
    filteredRepos = allRepos;
    renderProfile(user);
    calculateStats(allRepos);
    setupFilters(allRepos);
    renderRepos(filteredRepos);
    
    // Show data source indicator
    showDataSourceIndicator(dataSource);
}

function showDataSourceIndicator(source) {
    const messages = {
        'cache': '📦 Datos desde caché del navegador',
        'api': '🌐 Datos actualizados desde GitHub API',
        'fallback': '⚠️ Usando caché expirada (sin conexión)'
    };
    
    console.log(messages[source] || messages.api);
    
    // Show in UI
    const indicator = document.getElementById('data-source-indicator');
    const sourceText = document.getElementById('data-source-text');
    const cacheAgeText = document.getElementById('cache-age-text');
    
    if (indicator && sourceText) {
        const displayMessages = {
            'cache': 'Caché del navegador',
            'api': 'GitHub API',
            'fallback': 'Caché expirada'
        };
        
        sourceText.textContent = `Fuente: ${displayMessages[source] || displayMessages.api}`;
        
        const timestamp = localStorage.getItem(CACHE_KEY_TIME);
        if (timestamp && (source === 'cache' || source === 'fallback')) {
            const cacheAge = Math.floor((Date.now() - parseInt(timestamp)) / (60 * 1000));
            const displayAge = cacheAge < 60 
                ? `${cacheAge} min` 
                : `${Math.floor(cacheAge / 60)}h ${cacheAge % 60}min`;
            if (cacheAgeText) cacheAgeText.textContent = `· Última actualización: hace ${displayAge}`;
        } else {
            if (cacheAgeText) cacheAgeText.textContent = source === 'api' ? '· Recién actualizado' : '';
        }
        
        indicator.classList.remove('hidden');
    }
}

function showToast(title = 'Modo Caché', message = 'Datos almacenados localmente', type = 'info') {
    const toast = document.getElementById('toast');
    
    // Icon and color mappings with complete strings for Tailwind
    const iconMap = {
        'info': 'wifi-off',
        'warning': 'alert-triangle',
        'success': 'check-circle',
        'error': 'x-circle'
    };
    
    const colorClassMap = {
        'info': 'toast__icon--info',
        'warning': 'toast__icon--warning',
        'success': 'toast__icon--success',
        'error': 'toast__icon--error'
    };
    
    const icon = iconMap[type] || iconMap.info;
    const colorClass = colorClassMap[type] || colorClassMap.info;
    
    // Update toast content
    const iconElement = toast.querySelector('[data-lucide]');
    const titleElement = toast.querySelector('.toast__title');
    const messageElement = toast.querySelector('.toast__message');
    
    if (iconElement) {
        iconElement.setAttribute('data-lucide', icon);
        iconElement.className = colorClass;
    }
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    
    toast.classList.remove('hidden');
    toast.classList.add('toast--visible');
    
    // Reinitialize icons
    lucide.createIcons();
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 500);
    }, 5000);
}

function hideLoading() {
    const loader = document.getElementById('loading');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
        document.getElementById('main-content').style.opacity = '1';
    }, 300);
}

function showError(msg) {
    document.getElementById('loading').innerHTML = `
        <div class="error-screen">
            <p class="error-title">¡Ups!</p>
            <p class="error-message">${msg}</p>
            <button onclick="location.reload()" class="btn-retry">Reintentar</button>
        </div>
    `;
}

function renderProfile(user) {
    const avatarImg = document.getElementById('avatar');
    avatarImg.src = user.avatar_url;
    avatarImg.alt = `${user.name || user.login} - Avatar`;
    
    document.getElementById('name').textContent = user.name || USERNAME;
    document.getElementById('username').textContent = `@${user.login}`;
    animateCounter(document.getElementById('followers'), user.followers, 1000);
    animateCounter(document.getElementById('following'), user.following, 1000);
    document.getElementById('github-link').href = user.html_url;
}

function calculateStats(repos) {
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);
    const langs = {};
    repos.forEach(r => { if(r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
    const topLang = Object.keys(langs).length > 0 
        ? Object.keys(langs).reduce((a, b) => langs[a] > langs[b] ? a : b) 
        : 'N/A';

    // Use animated counters
    animateCounter(document.getElementById('total-repos'), repos.length, 1200);
    animateCounter(document.getElementById('total-stars'), totalStars, 1500);
    animateCounter(document.getElementById('total-forks'), totalForks, 1500);
    document.getElementById('top-lang').textContent = topLang;
}

// --- RENDERIZADO ---
function renderRepos(repos, append = false, searchTerm = '') {
    const grid = document.getElementById('repos-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const showingCountLabel = document.getElementById('showing-count');
    
    if (!append) grid.innerHTML = '';

    if (repos.length === 0) {
        grid.innerHTML = `<div class="repos-grid__empty">Sin resultados encontrados</div>`;
        loadMoreBtn.classList.add('hidden');
        showingCountLabel.textContent = '';
        return;
    }

    const startIndex = append ? visibleCount - ITEMS_PER_PAGE : 0;
    const itemsToShow = repos.slice(startIndex, visibleCount);

    if(append && itemsToShow.length === 0) return;

    const fragment = document.createDocumentFragment();

    itemsToShow.forEach((repo) => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        
        const langColor = LANG_COLORS[repo.language] || '#ffffff';
        
        // Escapar datos para prevenir XSS
        const repoName = escapeHtml(repo.name);
        const repoDesc = escapeHtml(repo.description) || 'Sin descripción disponible.';
        
        // Highlight search terms
        const highlightedName = searchTerm ? highlightText(repoName, searchTerm) : repoName;
        const highlightedDesc = searchTerm ? highlightText(repoDesc, searchTerm) : repoDesc;
        
        const repoCloneUrl = sanitizeUrl(repo.clone_url);
        const repoHtmlUrl = sanitizeUrl(repo.html_url);
        
        // Calculate days since last update
        const daysSinceUpdate = Math.floor((new Date() - new Date(repo.pushed_at)) / (1000 * 60 * 60 * 24));
        const updateBadge = daysSinceUpdate === 0 ? 'Hoy' : 
                           daysSinceUpdate === 1 ? 'Ayer' : 
                           daysSinceUpdate < 7 ? `Hace ${daysSinceUpdate} días` :
                           daysSinceUpdate < 30 ? `Hace ${Math.floor(daysSinceUpdate / 7)} semanas` :
                           `Hace ${Math.floor(daysSinceUpdate / 30)} meses`;
        
        // Configuración de URLs
        let hasWeb = false;
        let webUrl = '#';
        if (repo.homepage && repo.homepage.trim() !== "") {
            const homepage = repo.homepage.trim();
            webUrl = homepage.startsWith('http') ? homepage : 'https://' + homepage;
            webUrl = sanitizeUrl(webUrl);
            hasWeb = webUrl !== '#';
        }

        // Generador de Badges (Limpio)
        const generateBadge = (topic) => {
            const logos = {
                'react': 'react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB',
                'vue': 'vue.js-%2335495e.svg?style=flat&logo=vuedotjs&logoColor=%234FC08D',
                'angular': 'angular-%23DD0031.svg?style=flat&logo=angular&logoColor=white',
                'javascript': 'javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E',
                'typescript': 'typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white',
                'python': 'python-3670A0?style=flat&logo=python&logoColor=ffdd54',
                'html': 'html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white',
                'css': 'css3-%231572B6.svg?style=flat&logo=css3&logoColor=white',
                'tailwind': 'tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white',
                'node': 'node.js-6DA55F?style=flat&logo=node.js&logoColor=white',
                'nextjs': 'Next-black?style=flat&logo=next.js&logoColor=white'
            };
            const safeTopic = encodeURIComponent(topic);
            const url = logos[topic.toLowerCase()] || `${safeTopic}-blue?style=flat&logo=github`;
            return `<img src="https://img.shields.io/badge/${url}" alt="${escapeHtml(topic)}" class="repo-card__tech-badge" loading="lazy">`;
        };

        const badgesHtml = repo.topics && repo.topics.length > 0
            ? `<div class="repo-card__badges">
                ${repo.topics.slice(0, 4).map(t => generateBadge(t)).join('')}
               </div>`
            : '<div class="repo-card__badges-empty"></div>';

        // HTML Definitivo de la Tarjeta
        card.innerHTML = `
            <div class="repo-card__header">
                <div class="repo-card__folder-icon">
                    <i data-lucide="folder"></i>
                </div>
                
                <div class="repo-card__actions" id="actions-${repo.id}">
                    ${hasWeb ? `
                    <a href="${webUrl}" target="_blank" rel="noopener noreferrer" class="repo-card__web-link" title="Ver Proyecto Online">
                        <i data-lucide="globe"></i> WEB
                    </a>` : ''}
                    
                    <a href="${repoHtmlUrl}" target="_blank" rel="noopener noreferrer" class="repo-card__github-link" title="Ver en GitHub">
                        <i data-lucide="external-link"></i>
                    </a>
                    <a href="https://vscode.dev/github/${USERNAME}/${repo.name}" target="_blank" rel="noopener noreferrer" class="repo-card__vscode-link" title="Abrir en VS Code Online">
                        <i data-lucide="code-2"></i> VS Code
                    </a>
                </div>
            </div>
            
            ${badgesHtml}
            
            <div class="repo-card__update-row">
                <span class="repo-card__update-tag">
                    <i data-lucide="clock"></i>
                    ${updateBadge}
                </span>
            </div>
            
            <h3 class="repo-card__name">${highlightedName}</h3>
            <p class="repo-card__description truncate-2-lines">${highlightedDesc}</p>
            
            <div class="repo-card__footer">
                <div class="repo-card__language">
                    ${repo.language ? `<span class="repo-card__lang-dot" style="background-color: ${langColor}; box-shadow: 0 0 5px ${langColor}"></span> ${escapeHtml(repo.language)}` : ''}
                </div>
                <div class="repo-card__stats">
                    <span class="repo-card__stat"><i data-lucide="star"></i> ${repo.stargazers_count}</span>
                    <span class="repo-card__stat"><i data-lucide="git-fork"></i> ${repo.forks_count}</span>
                </div>
            </div>
        `;
        
        // Add clone button with event listener (secure approach)
        const actionsDiv = card.querySelector(`#actions-${repo.id}`);
        const cloneBtn = document.createElement('button');
        cloneBtn.className = 'repo-card__clone-btn';
        cloneBtn.title = "Copiar 'git clone'";
        cloneBtn.innerHTML = '<i data-lucide="clipboard-copy"></i>';
        cloneBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyCloneCommand(repoCloneUrl, cloneBtn);
        });
        actionsDiv.insertBefore(cloneBtn, actionsDiv.firstChild);
        
        card.onclick = (e) => {
            if(!e.target.closest('a') && !e.target.closest('button')) openRepoViewer(repo);
        };
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    lucide.createIcons();

    if (visibleCount < repos.length) {
        loadMoreBtn.classList.remove('hidden');
    } else {
        loadMoreBtn.classList.add('hidden');
    }
    showingCountLabel.textContent = `Mostrando ${Math.min(visibleCount, repos.length)} de ${repos.length}`;
    
    // Setup intersection observer for animation
    if (!append) {
        setTimeout(() => setupIntersectionObserver(), 100);
    }
}

// --- FILTROS Y BÚSQUEDA ---
function setupFilters(repos) {
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
    const container = document.getElementById('filter-container');
    container.innerHTML = `<button class="${FILTER_BTN_ALL_ACTIVE}" data-filter="all" onclick="filterByLang('all', this)">Todos</button>`;

    languages.forEach(lang => {
        const btn = document.createElement('button');
        btn.className = FILTER_BTN_INACTIVE;
        btn.textContent = lang;
        btn.onclick = () => filterByLang(lang, btn);
        container.appendChild(btn);
    });
}

function filterByLang(lang, btnElement) {
    if (lang === 'all') {
        currentLangFilter = 'all';
    } else {
        currentLangFilter = currentLangFilter === lang ? 'all' : lang;
    }
    
    document.querySelectorAll('#filter-container button').forEach(b => {
        b.className = FILTER_BTN_INACTIVE;
    });

    if (currentLangFilter !== 'all') {
        btnElement.className = FILTER_BTN_ACTIVE;
    } else {
        document.querySelector('[data-filter="all"]').className = FILTER_BTN_ALL_ACTIVE;
    }

    handleSearch(document.getElementById('search-input').value);
}

function handleSearch(term) {
    term = term.toLowerCase();
    filteredRepos = allRepos.filter(repo => {
        const matchesSearch = repo.name.toLowerCase().includes(term) || (repo.description || '').toLowerCase().includes(term);
        const matchesLang = currentLangFilter === 'all' || repo.language === currentLangFilter;
        return matchesSearch && matchesLang;
    });
    // Apply current sorting
    filteredRepos = sortRepositories(filteredRepos, currentSort);
    visibleCount = ITEMS_PER_PAGE;
    renderRepos(filteredRepos, false, term);
}

// Helper function to highlight search terms
function highlightText(text, term) {
    if (!term || term.length === 0) return text;
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- THEME TOGGLE ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('light', savedTheme === 'light');
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.classList.contains('light');
    const newTheme = isLight ? 'dark' : 'light';
    
    html.classList.toggle('light');
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const darkIcon = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');
    
    if (theme === 'light') {
        darkIcon?.classList.add('hidden');
        lightIcon?.classList.remove('hidden');
    } else {
        darkIcon?.classList.remove('hidden');
        lightIcon?.classList.add('hidden');
    }
}

// --- VISOR DE CÓDIGO (Árbol de Directorios) ---

// 1. Convierte la lista plana de GitHub en una estructura de árbol
function buildHierarchy(files) {
    const root = {};
    files.forEach(file => {
        const parts = file.path.split('/');
        let current = root;
        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = {
                    name: part,
                    type: index === parts.length - 1 ? 'file' : 'folder',
                    path: file.path,
                    children: {}
                };
            }
            current = current[part].children;
        });
    });
    return root;
}

// 2. Genera el HTML recursivo con <details> para carpetas
function generateTreeHTML(node, repoName, branch) {
    let html = '';
    // Ordenar: Carpetas primero, luego archivos (alfabéticamente)
    const entries = Object.values(node).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    });

    entries.forEach(item => {
        if (item.type === 'folder') {
            html += `
                <details class="tree-folder">
                    <summary class="tree-folder__summary">
                        <i data-lucide="folder" class="tree-folder__icon tree-folder__icon--closed"></i>
                        <i data-lucide="folder-open" class="tree-folder__icon tree-folder__icon--open"></i>
                        <span class="tree-folder__name">${item.name}</span>
                    </summary>
                    <div class="tree-folder__children">
                        ${generateTreeHTML(item.children, repoName, branch)}
                    </div>
                </details>
            `;
        } else {
            html += `
                <div class="tree-file file-node"
                     onclick="handleFileClick(this)"
                     data-repo="${repoName}"
                     data-branch="${branch}"
                     data-path="${item.path}">
                    <i data-lucide="file-code"></i>
                    ${item.name}
                </div>
            `;
        }
    });
    return html;
}

// 3. Función intermedia para manejar el click limpiamente
function handleFileClick(element) {
    const { repo, branch, path } = element.dataset;
    loadFileContent(repo, branch, path, element);
}

// 4. Abre el modal y carga el árbol
async function openRepoViewer(repo) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden', 'closing');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    document.getElementById('modal-title').textContent = repo.name;

    const fileTree = document.getElementById('file-tree');
    fileTree.innerHTML = '<div class="modal__loading--pulse">Cargando estructura...</div>';
    
    // Preparar visor
    const viewer = document.getElementById('code-viewer');
    viewer.innerHTML = '<div class="modal__loading"><i data-lucide="loader-2"></i><p class="modal__loading-text">Buscando README...</p></div>';
    lucide.createIcons();

    try {
        const cacheKey = `${repo.name}:${repo.default_branch}`;
        let data;
        
        // Check session cache first
        if (sessionCache.trees.has(cacheKey)) {
            console.log('Using cached tree data');
            data = sessionCache.trees.get(cacheKey);
        } else {
            const res = await fetch(`https://api.github.com/repos/${USERNAME}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`);
            if (!res.ok) throw new Error('Error API');
            data = await res.json();
            // Cache the tree data
            sessionCache.trees.set(cacheKey, data);
        }
        
        if (data.tree) {
            const blobs = data.tree.filter(i => i.type === 'blob');
            const hierarchy = buildHierarchy(blobs);
            fileTree.innerHTML = generateTreeHTML(hierarchy, repo.name, repo.default_branch);
            lucide.createIcons();

            // --- LÓGICA AUTO-README ---
            // Buscamos readme.md sin importar mayúsculas/minúsculas
            const readmeNode = blobs.find(f => f.path.toLowerCase() === 'readme.md');
            
            if (readmeNode) {
                // Si existe, lo cargamos usando un flag 'isReadme' para renderizar Markdown
                loadReadmeContent(repo.name, repo.default_branch, readmeNode.path);
            } else {
                viewer.innerHTML = '<div class="modal__loading"><i data-lucide="mouse-pointer"></i><p class="modal__loading-text">Selecciona un archivo</p></div>';
                lucide.createIcons();
            }
            // --------------------------
        }
    } catch (e) {
        console.error(e);
        fileTree.innerHTML = '<div class="modal__error">Error al cargar</div>';
    }
}

// Nueva función específica para READMEs
async function loadReadmeContent(repoName, branch, path) {
    const viewer = document.getElementById('code-viewer');
    try {
        const cacheKey = `readme:${repoName}:${branch}:${path}`;
        let content;
        
        // Check session cache first
        if (sessionCache.files.has(cacheKey)) {
            console.log('Using cached README content');
            content = sessionCache.files.get(cacheKey);
        } else {
            const res = await fetch(`https://api.github.com/repos/${USERNAME}/${repoName}/contents/${path}?ref=${branch}`);
            
            if (res.status === 403) {
                throw new Error('API_LIMIT');
            }
            
            if (!res.ok) {
                throw new Error('Error de lectura');
            }
            
            const data = await res.json();
            
            // Decodificar Base64 con TextDecoder (método correcto)
            const binaryString = atob(data.content.replace(/\s/g, ''));
            const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
            content = new TextDecoder().decode(bytes);
            
            // Cache the content
            sessionCache.files.set(cacheKey, content);
        }
        
        // Renderizar con MARKED.js
        viewer.innerHTML = `
            <div class="h-full overflow-auto custom-scroll">
                <div class="markdown-body">
                    ${marked.parse(content)}
                </div>
            </div>`;
            
    } catch (e) {
        console.error('Error loading README:', e);
        if (e.message === 'API_LIMIT') {
            viewer.innerHTML = '<div class="modal__message modal__message--warning">Límite de API alcanzado. Por favor, espera unos minutos.</div>';
        } else {
            viewer.innerHTML = '<div class="modal__message modal__message--muted">No se pudo cargar el README.</div>';
        }
    }
}


// 5. Carga el contenido del archivo (Modificado para la nueva estructura)
async function loadFileContent(repoName, branch, path, element) {
    // Limpiar selección previa (solo en elementos con clase .file-node)
    document.querySelectorAll('.file-node').forEach(d => {
        d.classList.remove('tree-file--active');
    });
    
    // Marcar actual
    if(element) element.classList.add('tree-file--active');
    
    const viewer = document.getElementById('code-viewer');
    viewer.innerHTML = '<div class="modal__loading"><div class="loading-spinner-small" style="width:1.5rem;height:1.5rem;border:2px solid var(--color-primary);border-top-color:transparent;border-radius:9999px;animation:spin 1s linear infinite"></div></div>';

    try {
        const cacheKey = `${repoName}:${branch}:${path}`;
        let content;
        
        // Check session cache first
        if (sessionCache.files.has(cacheKey)) {
            console.log('Using cached file content');
            content = sessionCache.files.get(cacheKey);
        } else {
            // EncodeURIComponent es vital por si la ruta tiene espacios o #
            const safePath = path.split('/').map(p => encodeURIComponent(p)).join('/');
            const res = await fetch(`https://api.github.com/repos/${USERNAME}/${repoName}/contents/${safePath}?ref=${branch}`);
            
            if (res.status === 403) throw new Error('API_LIMIT');
            if (!res.ok) throw new Error('Error de lectura');
            
            const data = await res.json();
            
            if (data.encoding === 'base64') {
                // Decodificación segura de caracteres especiales (UTF-8)
                const binaryString = atob(data.content.replace(/\s/g, ''));
                const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                content = new TextDecoder().decode(bytes);
                // Cache the content
                sessionCache.files.set(cacheKey, content);
            } else {
                content = 'Archivo binario o muy grande.';
            }
        }

        const escaped = content.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#039;'}[m]));
        viewer.innerHTML = `<pre class="code-content">${escaped}</pre>`;
        
    } catch (e) {
        console.error(e);
        viewer.innerHTML = '<div class="modal__error"><i data-lucide="alert-triangle"></i>Error al cargar archivo</div>';
        lucide.createIcons();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('closing');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('closing');
        document.body.style.overflow = ''; // Restore body scroll
        
        // Limpiar el contenido para que al abrir otro repo se vea limpio
        document.getElementById('file-tree').innerHTML = '';
        document.getElementById('code-viewer').innerHTML = '';
    }, 300);
}

// --- UTILIDAD: COPIAR CLONE ---
async function copyCloneCommand(url, btn) {
    const command = `git clone ${url}`;
    
    try {
        await navigator.clipboard.writeText(command);
        
        // Feedback visual: Cambiar icono a Check verde
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="clone-success-icon"></i>`;
        lucide.createIcons();
        
        // Restaurar después de 2 segundos
        setTimeout(() => {
            btn.innerHTML = originalContent;
            lucide.createIcons();
        }, 2000);
        
    } catch (err) {
        console.error('Error al copiar:', err);
        // Fallback: mostrar en alert
        alert(`Copia este comando:\n${command}`);
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// --- UTILIDADES DE SEGURIDAD ---
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeUrl(url) {
    if (!url) return '#';
    // Ensure URL is safe (starts with http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return '#';
}

// --- KEYBOARD NAVIGATION ---
function handleGlobalKeyboard(e) {
    const modal = document.getElementById('modal');
    if (!modal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
}

// --- ANIMATED COUNTER ---
function animateCounter(element, target, duration = 1500) {
    if (!element) return; // Protección contra elemento null
    if (target === 0) { element.textContent = 0; return; }
    
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// --- INTERSECTION OBSERVER FOR CARDS ---
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, options);
    
    // Observe all repo cards
    document.querySelectorAll('.repo-card').forEach(card => {
        card.classList.add('fade-in-hidden');
        observer.observe(card);
    });
}

// --- SORT REPOSITORIES ---
function sortRepositories(repos, sortBy) {
    const sorted = [...repos];
    switch(sortBy) {
        case 'stars':
            return sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
        case 'forks':
            return sorted.sort((a, b) => b.forks_count - a.forks_count);
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'updated':
        default:
            return sorted.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    }
}

function applySorting(sortBy) {
    currentSort = sortBy;
    filteredRepos = sortRepositories(filteredRepos, sortBy);
    visibleCount = ITEMS_PER_PAGE;
    renderRepos(filteredRepos);
    
    // Update active state in sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active-sort');
    });
    document.querySelector(`[data-sort="${sortBy}"]`)?.classList.add('active-sort');
}