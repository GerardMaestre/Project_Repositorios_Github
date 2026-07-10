import { USERNAME, CACHE_KEY_USER, CACHE_KEY_REPOS, CACHE_KEY_TIME, CACHE_DURATION } from './utils.js';

export function getCachedData() {
    try {
        const timestamp = localStorage.getItem(CACHE_KEY_TIME);
        const user = localStorage.getItem(CACHE_KEY_USER);
        const repos = localStorage.getItem(CACHE_KEY_REPOS);
        if (!timestamp || !user || !repos) return null;
        const now = Date.now();
        if (now - parseInt(timestamp) < CACHE_DURATION) {
            return { user: JSON.parse(user), repos: JSON.parse(repos) };
        }
    } catch (e) {
        clearCache();
    }
    return null;
}

export function saveToCache(user, repos) {
    try {
        localStorage.setItem(CACHE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(CACHE_KEY_REPOS, JSON.stringify(repos));
        localStorage.setItem(CACHE_KEY_TIME, Date.now().toString());
    } catch (e) {
        console.warn('Storage lleno', e);
    }
}

export function getExpiredCache() {
    try {
        const user = localStorage.getItem(CACHE_KEY_USER);
        const repos = localStorage.getItem(CACHE_KEY_REPOS);
        if (user && repos) {
            return { user: JSON.parse(user), repos: JSON.parse(repos) };
        }
    } catch (e) {
        clearCache();
    }
    return null;
}

export function clearCache() {
    try {
        localStorage.removeItem(CACHE_KEY_USER);
        localStorage.removeItem(CACHE_KEY_REPOS);
        localStorage.removeItem(CACHE_KEY_TIME);
    } catch (e) {
        console.warn('Error al limpiar caché:', e);
    }
}

export async function fetchApiData(username) {
    const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
    ]);
    if (userRes.status === 403 || reposRes.status === 403) {
        throw new Error('API_LIMIT');
    }
    if (!userRes.ok || !reposRes.ok) {
        throw new Error('Error API');
    }
    return {
        user: await userRes.json(),
        repos: await reposRes.json()
    };
}

export async function fetchFallbackData() {
    const res = await fetch('./database.json');
    if (!res.ok) throw new Error('No local database');
    const data = await res.json();
    return { user: data.user, repos: data.repos };
}

export async function fetchRepoTree(repoName, branch) {
    const url = `https://api.github.com/repos/${USERNAME}/${repoName}/git/trees/${branch}?recursive=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error tree API');
    return res.json();
}

export async function fetchFileContent(repoName, branch, path) {
    const safePath = path.split('/').map(p => encodeURIComponent(p)).join('/');
    const url = `https://api.github.com/repos/${USERNAME}/${repoName}/contents/${safePath}?ref=${branch}`;
    const res = await fetch(url);
    if (res.status === 403) throw new Error('API_LIMIT');
    if (!res.ok) throw new Error('Error file API');
    const data = await res.json();
    if (data.encoding === 'base64') {
        const binaryString = atob(data.content.replace(/\s/g, ''));
        const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }
    return 'Archivo binario o muy grande.';
}
