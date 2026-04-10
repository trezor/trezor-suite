export function debounce(fn, ms = 300) {
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

export function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;

    return div.innerHTML;
}

export function renderTags(tags) {
    if (!tags || tags.length === 0) return '<span class="text-muted">—</span>';

    return tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
}

export function truncate(str, len = 80) {
    if (!str) return '';
    if (str.length <= len) return str;

    return str.substring(0, len) + '…';
}
