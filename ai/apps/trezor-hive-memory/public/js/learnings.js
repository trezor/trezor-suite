import { api } from './api.js';
import { debounce, escapeHtml, formatDate, renderTags, truncate } from './utils.js';

let container;
let currentOffset = 0;
const PAGE_SIZE = 20;
let expandedId = null;
let editingId = null;

export function init(el) {
    container = el;
    container.innerHTML = `
        <div class="controls">
            <input type="text" id="learn-search" placeholder="Full-text search…" style="flex:1;min-width:200px">
            <input type="text" id="learn-tags" placeholder="Tags (comma-separated)">
            <input type="text" id="learn-engineer" placeholder="Engineer">
            <input type="date" id="learn-since">
            <button class="btn" id="learn-clear">Clear</button>
        </div>
        <div id="learnings-table"></div>
        <div class="pagination" id="learnings-pagination"></div>
    `;

    const searchInput = container.querySelector('#learn-search');
    const tagsInput = container.querySelector('#learn-tags');
    const engineerInput = container.querySelector('#learn-engineer');
    const sinceInput = container.querySelector('#learn-since');

    const reload = debounce(() => { currentOffset = 0; loadLearnings(); }, 300);

    searchInput.addEventListener('input', reload);
    tagsInput.addEventListener('input', reload);
    engineerInput.addEventListener('input', reload);
    sinceInput.addEventListener('change', reload);

    container.querySelector('#learn-clear').addEventListener('click', () => {
        searchInput.value = '';
        tagsInput.value = '';
        engineerInput.value = '';
        sinceInput.value = '';
        currentOffset = 0;
        loadLearnings();
    });

    loadLearnings();
}

async function loadLearnings() {
    const params = {
        q: container.querySelector('#learn-search').value || undefined,
        tags: container.querySelector('#learn-tags').value || undefined,
        engineer: container.querySelector('#learn-engineer').value || undefined,
        since: container.querySelector('#learn-since').value || undefined,
        limit: PAGE_SIZE,
        offset: currentOffset,
    };

    try {
        const result = await api.searchLearnings(params);
        renderTable(result);
        renderPagination(result);
    } catch (err) {
        container.querySelector('#learnings-table').innerHTML = `<p class="text-muted">Error: ${escapeHtml(err.message)}</p>`;
    }
}

function renderTable(result) {
    const tableEl = container.querySelector('#learnings-table');

    if (result.items.length === 0) {
        tableEl.innerHTML = '<p class="text-muted mt-2">No learnings found.</p>';

        return;
    }

    let html = `<table>
        <thead><tr>
            <th>Summary</th><th>Tags</th><th>Engineer</th><th>Created</th><th>Actions</th>
        </tr></thead><tbody>`;

    for (const item of result.items) {
        html += renderRow(item);
        if (expandedId === item.id) {
            html += renderDetailRow(item);
        }
    }

    html += '</tbody></table>';
    tableEl.innerHTML = html;

    // Bind events
    tableEl.querySelectorAll('[data-expand]').forEach(el => {
        el.addEventListener('click', () => toggleExpand(el.dataset.expand));
    });
    tableEl.querySelectorAll('[data-edit]').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); startEdit(el.dataset.edit); });
    });
    tableEl.querySelectorAll('[data-delete]').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); confirmDelete(el.dataset.delete); });
    });
    tableEl.querySelectorAll('[data-save]').forEach(el => {
        el.addEventListener('click', () => saveEdit(el.dataset.save));
    });
    tableEl.querySelectorAll('[data-cancel]').forEach(el => {
        el.addEventListener('click', () => cancelEdit());
    });
}

function renderRow(item) {
    return `<tr>
        <td class="summary-cell" data-expand="${item.id}" title="${escapeHtml(item.summary)}">${escapeHtml(truncate(item.summary, 80))}</td>
        <td>${renderTags(item.tags)}</td>
        <td class="text-muted">${escapeHtml(item.engineerId) || '—'}</td>
        <td class="text-muted text-sm">${formatDate(item.createdAt)}</td>
        <td>
            <button class="btn btn-sm" data-edit="${item.id}" title="Edit">&#9998;</button>
            <button class="btn btn-sm btn-danger" data-delete="${item.id}" title="Delete">&#10005;</button>
        </td>
    </tr>`;
}

function renderDetailRow(item) {
    const isEditing = editingId === item.id;

    if (isEditing) {
        return `<tr class="detail-row"><td colspan="5">
            <div class="detail-content">
                <label>Summary</label>
                <textarea id="edit-summary" rows="2">${escapeHtml(item.summary)}</textarea>
                <label>Detail</label>
                <textarea id="edit-detail" rows="4">${escapeHtml(item.detail || '')}</textarea>
                <label>Tags (comma-separated)</label>
                <input class="edit-tags" id="edit-tags" value="${escapeHtml(item.tags.join(', '))}">
                <div class="detail-actions">
                    <button class="btn btn-primary btn-sm" data-save="${item.id}">Save</button>
                    <button class="btn btn-sm" data-cancel="${item.id}">Cancel</button>
                </div>
            </div>
        </td></tr>`;
    }

    return `<tr class="detail-row"><td colspan="5">
        <div class="detail-content">
            <label>Detail</label>
            <div>${escapeHtml(item.detail || 'No detail provided.')}</div>
            <label>ID</label>
            <div class="text-muted text-sm">${item.id}</div>
        </div>
    </td></tr>`;
}

function toggleExpand(id) {
    expandedId = expandedId === id ? null : id;
    editingId = null;
    loadLearnings();
}

function startEdit(id) {
    expandedId = id;
    editingId = id;
    loadLearnings();
}

function cancelEdit() {
    editingId = null;
    loadLearnings();
}

async function saveEdit(id) {
    const summary = container.querySelector('#edit-summary')?.value?.trim();
    const detail = container.querySelector('#edit-detail')?.value?.trim();
    const tagsRaw = container.querySelector('#edit-tags')?.value?.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    try {
        await api.updateLearning(id, { summary, detail, tags });
        editingId = null;
        loadLearnings();
    } catch (err) {
        alert(`Failed to save: ${err.message}`);
    }
}

function confirmDelete(id) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <h3>Delete learning?</h3>
            <p>This will permanently remove the learning from Postgres and Neo4j.</p>
            <div class="modal-actions">
                <button class="btn" id="modal-cancel">Cancel</button>
                <button class="btn btn-danger" id="modal-confirm">Delete</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-confirm').addEventListener('click', async () => {
        overlay.remove();
        try {
            await api.deleteLearning(id);
            if (expandedId === id) expandedId = null;
            loadLearnings();
        } catch (err) {
            alert(`Failed to delete: ${err.message}`);
        }
    });
}

function renderPagination(result) {
    const pagEl = container.querySelector('#learnings-pagination');
    const start = result.offset + 1;
    const end = Math.min(result.offset + result.items.length, result.total);
    const hasPrev = result.offset > 0;
    const hasNext = result.offset + result.limit < result.total;

    pagEl.innerHTML = `
        <span>Showing ${start}–${end} of ${result.total}</span>
        <button class="btn btn-sm" id="page-prev" ${hasPrev ? '' : 'disabled'}>&#8592; Prev</button>
        <button class="btn btn-sm" id="page-next" ${hasNext ? '' : 'disabled'}>Next &#8594;</button>
    `;

    pagEl.querySelector('#page-prev')?.addEventListener('click', () => {
        currentOffset = Math.max(0, currentOffset - PAGE_SIZE);
        loadLearnings();
    });
    pagEl.querySelector('#page-next')?.addEventListener('click', () => {
        currentOffset += PAGE_SIZE;
        loadLearnings();
    });
}
