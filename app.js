import { USERNAME, debounce } from './modules/utils.js';
import { getState, setState, getCachedTree, setCachedTree, getCachedFile, setCachedFile } from './modules/state.js';
import { getCachedData, saveToCache, getExpiredCache, clearCache, fetchApiData, fetchFallbackData, fetchRepoTree, fetchFileContent } from './modules/api.js';
import { renderProfile, calculateStats, setupFilters, showDataSourceIndicator, showToast, renderRepos, prepareRepoViewer, renderRepoTree, showFileLoading, renderFileContent, showViewerError, renderReadme, closeModal, copyCloneCommand, hideLoading, showError, updateLoadingStatus } from './modules/ui.js';

async function initApp() {
    updateLoadingStatus('Conectando con GitHub...');
    try {
        const cached = getCachedData();
        if (cached) return handleCachedSuccess(cached);
        await fetchFreshOrFallback();
    } catch (error) {
        handleCriticalError(error);
    }
}

function handleCachedSuccess(cached) {
    updateLoadingStatus('Cargando desde caché...');
    processData(cached.user, cached.repos, 'cache');
    hideLoading();
}

async function fetchFreshOrFallback() {
    try {
        updateLoadingStatus('Consultando API GitHub...');
        const data = await fetchApiData(USERNAME);
        saveToCache(data.user, data.repos);
        processData(data.user, data.repos, 'api');
        hideLoading();
    } catch (apiError) {
        console.warn('Fallo la API, intentando database.json local...', apiError);
        await fetchLocalFallback();
    }
}

async function fetchLocalFallback() {
    updateLoadingStatus('Cargando datos locales...');
    const fallback = await fetchFallbackData();
    processData(fallback.user, fallback.repos, 'fallback');
    hideLoading();
}

function handleCriticalError(error) {
    console.error('Error crítico:', error);
    const expired = getExpiredCache();
    if (expired) {
        showToast('Modo Offline', 'Usando datos antiguos guardados', 'warning');
        processData(expired.user, expired.repos, 'fallback');
        hideLoading();
    } else {
        showError('No se pudieron cargar los datos. Verifica tu conexión.');
    }
}

function processData(user, repos, source) {
    setState({ allRepos: repos, filteredRepos: repos });
    renderProfile(user);
    calculateStats(repos);
    setupFilters(repos, handleFilterClick);
    renderRepos(repos, false, '', handleCardClick, handleCloneClick);
    showDataSourceIndicator(source);
}

function handleFilterClick(lang, btnElement) {
    const s = getState();
    const newFilter = (lang === 'all') ? 'all' : (s.currentLangFilter === lang ? 'all' : lang);
    setState({ currentLangFilter: newFilter });
    
    document.querySelectorAll('#filter-container button').forEach(b => {
        b.className = 'filter-btn';
    });
    if (newFilter !== 'all') {
        btnElement.className = 'filter-btn filter-btn--active';
    } else {
        document.querySelector('[data-filter="all"]').className = 'filter-btn filter-btn--active';
    }
    runFilterAndSearch();
}

function runFilterAndSearch() {
    const s = getState();
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = s.allRepos.filter(repo => {
        const matchesSearch = repo.name.toLowerCase().includes(term) || 
                              (repo.description || '').toLowerCase().includes(term);
        const matchesLang = s.currentLangFilter === 'all' || repo.language === s.currentLangFilter;
        return matchesSearch && matchesLang;
    });
    const sorted = sortRepositories(filtered, s.currentSort);
    setState({ filteredRepos: sorted, visibleCount: 9 });
    renderRepos(sorted, false, term, handleCardClick, handleCloneClick);
}

function sortRepositories(repos, sortBy) {
    const sorted = [...repos];
    if (sortBy === 'stars') return sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
    if (sortBy === 'forks') return sorted.sort((a, b) => b.forks_count - a.forks_count);
    if (sortBy === 'name') return sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

function handleSortClick(sortBy) {
    setState({ currentSort: sortBy });
    runFilterAndSearch();
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active-sort');
    });
    document.querySelector(`[data-sort="${sortBy}"]`)?.classList.add('active-sort');
}

async function handleCardClick(repo) {
    prepareRepoViewer(repo.name);
    try {
        const cacheKey = `${repo.name}:${repo.default_branch}`;
        let data = getCachedTree(cacheKey);
        if (!data) {
            data = await fetchRepoTree(repo.name, repo.default_branch);
            setCachedTree(cacheKey, data);
        }
        const blobs = renderRepoTree(repo, data, handleFileClick);
        const readmeNode = blobs.find(f => f.path.toLowerCase() === 'readme.md');
        if (readmeNode) loadReadme(repo.name, repo.default_branch, readmeNode.path);
        else showViewerError('Selecciona un archivo', 'warning');
    } catch (e) {
        showViewerError('Error al cargar la estructura del repositorio');
    }
}

async function handleFileClick(element) {
    const { repo, branch, path } = element.dataset;
    showFileLoading();
    try {
        const cacheKey = `${repo}:${branch}:${path}`;
        let content = getCachedFile(cacheKey);
        if (!content) {
            content = await fetchFileContent(repo, branch, path);
            setCachedFile(cacheKey, content);
        }
        renderFileContent(content, path, element);
    } catch (e) {
        showViewerError('Error al cargar archivo');
    }
}

async function loadReadme(repoName, branch, path) {
    try {
        const cacheKey = `readme:${repoName}:${branch}:${path}`;
        let content = getCachedFile(cacheKey);
        if (!content) {
            content = await fetchFileContent(repoName, branch, path);
            setCachedFile(cacheKey, content);
        }
        renderReadme(content);
    } catch (e) {
        showViewerError('No se pudo cargar el README.', 'warning');
    }
}

function handleCloneClick(url, btn) {
    copyCloneCommand(url, btn);
}

function handleLoadMore() {
    const s = getState();
    const newCount = s.visibleCount + 9;
    setState({ visibleCount: newCount });
    renderRepos(s.filteredRepos, true, '', handleCardClick, handleCloneClick);
}

function initStaticListeners() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    document.getElementById('load-more-btn').onclick = handleLoadMore;
    document.getElementById('search-input').oninput = debounce((e) => {
        runFilterAndSearch();
    }, 300);
    const toggleBtn = document.getElementById('toggle-filters-btn');
    const filtersRow = document.getElementById('filters-row');
    if (toggleBtn && filtersRow) {
        toggleBtn.onclick = () => {
            filtersRow.classList.toggle('hidden');
            toggleBtn.classList.toggle('active');
        };
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function initScrollBtn() {
    const scrollBtn = document.getElementById('scroll-to-top');
    const winContent = document.getElementById('mac-window-content');
    const useWindowScroll = document.body.classList.contains('web-mode');
    if (winContent && !useWindowScroll) {
        scrollBtn.onclick = () => winContent.scrollTo({ top: 0, behavior: 'smooth' });
        setupScrollTimeout(winContent, scrollBtn);
    } else {
        scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        setupScrollTimeout(window, scrollBtn);
    }
}

function setupScrollTimeout(target, btn) {
    let timeout;
    target.addEventListener('scroll', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const scrollY = target.scrollTop !== undefined ? target.scrollTop : window.scrollY;
            btn.style.opacity = scrollY > 300 ? '1' : '0';
            btn.style.pointerEvents = scrollY > 300 ? 'auto' : 'none';
        }, 100);
    });
}

function initClock() {
    updateMacClock();
    setInterval(updateMacClock, 30000);
}

function updateMacClock() {
    const el = document.getElementById('mac-clock');
    if (!el) return;
    const now = new Date();
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    el.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}  ${h}:${m}`;
}

function initWindowControls() {
    document.getElementById('mac-btn-close').onclick = () => {
        document.getElementById('mac-main-window').classList.add('mac-window--closed');
    };
    document.getElementById('mac-btn-minimize').onclick = () => {
        document.getElementById('mac-main-window').classList.toggle('mac-window--minimized');
    };
    document.getElementById('mac-btn-maximize').onclick = () => {
        document.getElementById('mac-main-window').classList.toggle('mac-window--fullscreen');
    };
}

function initDockActions() {
    document.getElementById('dock-home').onclick = () => {
        const winContent = document.getElementById('mac-window-content');
        if (winContent) winContent.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('mac-main-window').classList.remove('mac-window--closed', 'mac-window--minimized');
    };
    document.getElementById('dock-profile').onclick = () => {
        document.querySelector('.sidebar')?.scrollIntoView({ behavior: 'smooth' });
    };
    document.getElementById('dock-search').onclick = () => {
        const input = document.getElementById('search-input');
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input?.focus();
    };
    document.getElementById('dock-repos').onclick = () => {
        document.getElementById('repos-grid')?.scrollIntoView({ behavior: 'smooth' });
    };
}

function exposeGlobals() {
    window.closeModal = closeModal;
    window.applySorting = handleSortClick;
    window.filterByLang = handleFilterClick;
    window.forceRefreshData = () => {
        clearCache();
        location.reload();
    };
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.error('SW registration failed:', err));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initStaticListeners();
    initScrollBtn();
    initClock();
    initWindowControls();
    initDockActions();
    exposeGlobals();
    registerServiceWorker();
});
