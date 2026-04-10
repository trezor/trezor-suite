import { api, getToken, setToken } from './api.js';
import * as learnings from './learnings.js';
import * as sessions from './sessions.js';
import * as graph from './graph.js';

const tabs = { learnings, sessions, graph };
const tabEls = {};
let activeTab = null;

function switchTab(name) {
    if (activeTab === name) return;
    activeTab = name;

    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === name);
    });

    Object.entries(tabEls).forEach(([key, el]) => {
        el.classList.toggle('active', key === name);
    });

    if (tabs[name] && !tabEls[name].dataset.initialized) {
        tabs[name].init(tabEls[name]);
        tabEls[name].dataset.initialized = 'true';
    }
}

function initRouter() {
    const hash = location.hash.slice(1) || 'learnings';
    const tab = hash.split('?')[0];
    switchTab(tabs[tab] ? tab : 'learnings');

    window.addEventListener('hashchange', () => {
        const h = location.hash.slice(1).split('?')[0];
        switchTab(tabs[h] ? h : 'learnings');
    });
}

async function pollHealth() {
    const dot = document.getElementById('health-dot');
    const label = document.getElementById('health-label');

    try {
        const h = await api.health();
        dot.className = `health-dot ${h.status}`;
        label.textContent = h.status;
    } catch {
        dot.className = 'health-dot down';
        label.textContent = 'unreachable';
    }
}

function initTokenInput() {
    const input = document.getElementById('token-input');
    input.value = getToken();
    input.addEventListener('change', () => setToken(input.value));
}

// ── Bootstrap ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Register tab content elements
    document.querySelectorAll('.tab-content').forEach(el => {
        tabEls[el.id.replace('tab-', '')] = el;
    });

    // Nav buttons
    document.querySelectorAll('nav button[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            location.hash = btn.dataset.tab;
        });
    });

    initTokenInput();
    initRouter();
    pollHealth();
    setInterval(pollHealth, 30000);
});
