#!/usr/bin/env node
/**
 * Claude Code SessionEnd hook — auto-summarise and POST session to Trezor Hive Memory.
 *
 * Install in Claude Code settings.json:
 *   {
 *     "hooks": {
 *       "SessionEnd": [{
 *         "command": "node ai/scripts/session-end-hook.mjs"
 *       }]
 *     }
 *   }
 *
 * Environment variables:
 *   MEMORY_GATEWAY_URL  — Gateway base URL (default: http://127.0.0.1:8080)
 *   MEMORY_GATEWAY_TOKEN — Bearer token (default: "test" for local dev)
 *
 * The hook receives session context via CLAUDE_SESSION env vars set by Claude Code:
 *   CLAUDE_SESSION_ID, CLAUDE_CWD, CLAUDE_TRANSCRIPT_PATH
 *
 * If CLAUDE_TRANSCRIPT_PATH is set and readable, it extracts a summary from
 * the last N messages. Otherwise it posts a minimal "session ended" marker.
 */

import { readFileSync } from 'node:fs';

const GATEWAY_URL = process.env.MEMORY_GATEWAY_URL ?? 'http://127.0.0.1:8080';
const TOKEN = process.env.MEMORY_GATEWAY_TOKEN ?? 'test';
const TRANSCRIPT_PATH = process.env.CLAUDE_TRANSCRIPT_PATH;
const SESSION_ID = process.env.CLAUDE_SESSION_ID ?? 'unknown';
const CWD = process.env.CLAUDE_CWD ?? process.cwd();

/**
 * Read the last N lines from a JSONL transcript and extract a summary.
 * Each line is a JSON object with at least { role, content }.
 */
function extractSummary(transcriptPath) {
    try {
        const raw = readFileSync(transcriptPath, 'utf-8');
        const lines = raw.trim().split('\n').filter(Boolean);

        // Take last 30 messages for context
        const recent = lines
            .slice(-30)
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        if (recent.length === 0) return null;

        // Collect tool calls and user messages to build a summary
        const toolCalls = [];
        const userMessages = [];

        for (const msg of recent) {
            if (msg.role === 'user' && typeof msg.content === 'string') {
                userMessages.push(msg.content.slice(0, 200));
            }
            if (msg.role === 'assistant' && Array.isArray(msg.content)) {
                for (const block of msg.content) {
                    if (block.type === 'tool_use') {
                        toolCalls.push(block.name);
                    }
                }
            }
        }

        const uniqueTools = [...new Set(toolCalls)];
        const lastUserMsg = userMessages[userMessages.length - 1] ?? 'No user message';

        return {
            title: `Session in ${CWD.split('/').pop()}: ${lastUserMsg.slice(0, 60)}`,
            summary: [
                `Session ID: ${SESSION_ID}`,
                `Working directory: ${CWD}`,
                `Message count: ${lines.length}`,
                `Tools used: ${uniqueTools.join(', ') || 'none'}`,
                `Last user request: ${lastUserMsg}`,
            ].join('\n'),
            tags: ['auto-capture', 'session-end'],
        };
    } catch {
        return null;
    }
}

async function main() {
    const extracted = TRANSCRIPT_PATH ? extractSummary(TRANSCRIPT_PATH) : null;

    const payload = extracted ?? {
        title: `Session ended in ${CWD.split('/').pop()}`,
        summary: `Session ${SESSION_ID} ended. Working directory: ${CWD}`,
        tags: ['auto-capture', 'session-end'],
    };

    try {
        const res = await fetch(`${GATEWAY_URL}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
                ...payload,
                nextSteps: [],
                learningIds: [],
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`[session-end-hook] Failed to save session: ${res.status} ${body}`);
            process.exit(1);
        }

        const result = await res.json();
        console.error(`[session-end-hook] Session saved: ${result.id}`);
    } catch (err) {
        // Don't fail the hook if the gateway is down — this is best-effort
        console.error(`[session-end-hook] Gateway unreachable: ${err.message}`);
    }
}

main();
