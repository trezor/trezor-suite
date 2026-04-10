import { api } from './api.js';
import { escapeHtml } from './utils.js';

let container;
let network = null;
let allNodes = [];
let allEdges = [];

const NODE_COLORS = {
    Package: { background: '#3b82f6', border: '#2563eb', font: '#fff' },
    LearningEvent: { background: '#22c55e', border: '#16a34a', font: '#fff' },
    Symbol: { background: '#f97316', border: '#ea580c', font: '#fff' },
    Engineer: { background: '#a855f7', border: '#9333ea', font: '#fff' },
};

const EDGE_STYLES = {
    DEPENDS_ON: { color: '#6b7280', dashes: false },
    AFFECTS: { color: '#ef4444', dashes: [5, 5] },
    FIXED_BY: { color: '#6c8cff', dashes: [2, 4] },
};

export function init(el) {
    container = el;
    container.innerHTML = `
        <div class="graph-container">
            <div class="graph-controls">
                <label><input type="checkbox" data-type="Package" checked> Package</label>
                <label><input type="checkbox" data-type="LearningEvent" checked> Learning</label>
                <label><input type="checkbox" data-type="Symbol" checked> Symbol</label>
                <label><input type="checkbox" data-type="Engineer" checked> Engineer</label>
                <input type="text" id="graph-search" placeholder="Search nodes…" style="margin-left:auto">
                <button class="btn btn-sm" id="graph-fit">Zoom to fit</button>
                <button class="btn btn-sm" id="graph-reload">Reload</button>
            </div>
            <div id="graph-canvas"></div>
            <div class="graph-detail" id="graph-detail">Click a node to see details.</div>
        </div>
    `;

    container.querySelectorAll('[data-type]').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });

    container.querySelector('#graph-fit').addEventListener('click', () => network?.fit());
    container.querySelector('#graph-reload').addEventListener('click', loadGraph);

    container.querySelector('#graph-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        if (!network || !q) {
            network?.selectNodes([]);

            return;
        }
        const matching = allNodes.filter(n => n.label.toLowerCase().includes(q)).map(n => n.id);
        network.selectNodes(matching);
        if (matching.length > 0) {
            network.focus(matching[0], { scale: 1.2, animation: true });
        }
    });

    loadGraph();
}

async function loadGraph() {
    const detailEl = container.querySelector('#graph-detail');
    detailEl.innerHTML = 'Loading graph…';

    try {
        const data = await api.getGraph(1000);
        allNodes = data.nodes;
        allEdges = data.edges;
        renderGraph();
        detailEl.innerHTML = `${data.nodes.length} nodes, ${data.edges.length} edges. Click a node for details.`;
    } catch (err) {
        detailEl.innerHTML = `Error: ${escapeHtml(err.message)}`;
    }
}

function renderGraph() {
    const canvas = container.querySelector('#graph-canvas');
    if (!canvas || typeof vis === 'undefined') {
        canvas.innerHTML = '<p class="text-muted">vis-network not loaded.</p>';

        return;
    }

    const filteredTypes = getActiveTypes();
    const filteredNodes = allNodes.filter(n => filteredTypes.has(n.type));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = allEdges.filter(e => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to));

    const nodes = new vis.DataSet(filteredNodes.map(n => {
        const colors = NODE_COLORS[n.type] || NODE_COLORS.Package;

        return {
            id: n.id,
            label: n.label,
            color: { background: colors.background, border: colors.border },
            font: { color: colors.font, size: 11 },
            shape: n.type === 'LearningEvent' ? 'diamond' : n.type === 'Engineer' ? 'triangle' : n.type === 'Symbol' ? 'dot' : 'box',
            size: n.type === 'Package' ? 16 : 12,
            title: n.label,
            _type: n.type,
            _props: n.properties,
        };
    }));

    const edges = new vis.DataSet(filteredEdges.map((e, i) => {
        const style = EDGE_STYLES[e.relationship] || EDGE_STYLES.DEPENDS_ON;

        return {
            id: `e-${i}`,
            from: e.from,
            to: e.to,
            label: e.relationship,
            color: { color: style.color, opacity: 0.6 },
            dashes: style.dashes,
            font: { size: 9, color: '#6b7280', strokeWidth: 0 },
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        };
    }));

    if (network) network.destroy();

    network = new vis.Network(canvas, { nodes, edges }, {
        physics: {
            solver: 'forceAtlas2Based',
            forceAtlas2Based: { gravitationalConstant: -40, centralGravity: 0.005, springLength: 120 },
            stabilization: { iterations: 100 },
        },
        interaction: { hover: true, tooltipDelay: 200 },
        layout: { improvedLayout: true },
    });

    network.on('click', (params) => {
        if (params.nodes.length > 0) {
            const node = nodes.get(params.nodes[0]);
            showNodeDetail(node);
        }
    });

    network.on('doubleClick', async (params) => {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.get(nodeId);
            await expandNode(node);
        }
    });
}

function getActiveTypes() {
    const types = new Set();
    container.querySelectorAll('[data-type]:checked').forEach(cb => types.add(cb.dataset.type));

    return types;
}

function applyFilters() {
    renderGraph();
}

function showNodeDetail(node) {
    const detailEl = container.querySelector('#graph-detail');
    if (!node) {
        detailEl.innerHTML = 'Click a node to see details.';

        return;
    }

    const props = node._props || {};
    const entries = Object.entries(props)
        .filter(([k]) => k !== 'id' && k !== 'name')
        .map(([k, v]) => {
            const val = Array.isArray(v) ? v.join(', ') : String(v);

            return `<div><span class="label">${escapeHtml(k)}</span>: ${escapeHtml(val)}</div>`;
        })
        .join('');

    detailEl.innerHTML = `
        <div><span class="label">Type</span>: ${escapeHtml(node._type)}</div>
        <div><span class="label">ID</span>: ${escapeHtml(node.id)}</div>
        ${entries}
    `;
}

async function expandNode(node) {
    if (!node) return;

    try {
        const params = node._type === 'LearningEvent'
            ? { learningId: node.id }
            : { symbol: node.id };

        const related = await api.getRelated({ ...params, depth: 1 });

        const newNodes = [];
        for (const l of related.learnings) {
            if (!allNodes.some(n => n.id === l.id)) {
                newNodes.push({ id: l.id, label: l.summary?.substring(0, 50) || l.id, type: 'LearningEvent', properties: l });
            }
        }
        for (const s of related.symbols) {
            if (!allNodes.some(n => n.id === s.name)) {
                newNodes.push({ id: s.name, label: s.name, type: 'Symbol', properties: s });
            }
        }
        for (const e of related.engineers) {
            if (!allNodes.some(n => n.id === e.id)) {
                newNodes.push({ id: e.id, label: e.id, type: 'Engineer', properties: e });
            }
        }

        if (newNodes.length > 0) {
            allNodes = [...allNodes, ...newNodes];
            renderGraph();
        }
    } catch {
        // Silently ignore expansion failures
    }
}
