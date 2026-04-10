import { api } from './api.js';
import { escapeHtml, formatDate, renderTags } from './utils.js';

let container;

export function init(el) {
    container = el;
    container.innerHTML = `
        <div class="controls">
            <span style="font-weight:500">Sessions</span>
            <select id="session-limit">
                <option value="10">Last 10</option>
                <option value="25" selected>Last 25</option>
                <option value="50">Last 50</option>
            </select>
        </div>
        <div id="sessions-list"></div>
    `;

    container.querySelector('#session-limit').addEventListener('change', loadSessions);
    loadSessions();
}

async function loadSessions() {
    const limit = Number(container.querySelector('#session-limit').value);
    const listEl = container.querySelector('#sessions-list');

    try {
        const sessions = await api.getSessions(limit);

        if (sessions.length === 0) {
            listEl.innerHTML = '<p class="text-muted mt-2">No sessions found.</p>';

            return;
        }

        listEl.innerHTML = sessions.map(renderCard).join('');

        listEl.querySelectorAll('.session-header').forEach(header => {
            header.addEventListener('click', () => {
                header.closest('.session-card').classList.toggle('expanded');
            });
        });
    } catch (err) {
        listEl.innerHTML = `<p class="text-muted">Error: ${escapeHtml(err.message)}</p>`;
    }
}

function renderCard(session) {
    const nextStepsHtml = session.nextSteps.length > 0
        ? `<div class="section-label">Next Steps</div>
           <ul class="next-steps">${session.nextSteps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
        : '';

    const learningIdsHtml = session.learningIds.length > 0
        ? `<div class="section-label">Linked Learnings</div>
           <div class="text-sm">${session.learningIds.map(id =>
               `<a href="#learnings?id=${id}" style="color:var(--accent)">${id.substring(0, 8)}…</a>`
           ).join(', ')}</div>`
        : '';

    return `
        <div class="session-card">
            <div class="session-header">
                <span class="arrow">&#9654;</span>
                <span class="session-title">${escapeHtml(session.title)}</span>
                ${renderTags(session.tags)}
                <span class="text-muted text-sm">${escapeHtml(session.engineerId) || ''}</span>
                <span class="session-date">${formatDate(session.createdAt)}</span>
            </div>
            <div class="session-body">
                <div class="section-label">Summary</div>
                <div>${escapeHtml(session.summary)}</div>
                ${nextStepsHtml}
                ${learningIdsHtml}
            </div>
        </div>
    `;
}
