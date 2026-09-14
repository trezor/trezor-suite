import { type Config } from '@opencode-ai/sdk/v2';
import { join } from 'node:path';

import { BOT_DIR, REPO_ROOT } from './paths';

export const MODEL = {
    providerID: 'beast',
    modelID: process.env.LLM_EXPLORATORY_TESTER_MODEL ?? 'big',
};

// Reasoning effort, applied per request as the opencode variant (see
// runOpencode.ts) — the only path that reaches the model. Override with
// LLM_EXPLORATORY_TESTER_EFFORT; low/high are the safe variant names.
export const REASONING_EFFORT = process.env.LLM_EXPLORATORY_TESTER_EFFORT ?? 'high';

// Merged over the user's global opencode.json; enabled_providers must be set
// here or a global allowlist silently disables Beast.
export const OPENCODE_CONFIG: Config = {
    model: `${MODEL.providerID}/${MODEL.modelID}`,
    enabled_providers: [MODEL.providerID],
    provider: {
        beast: {
            npm: '@ai-sdk/openai-compatible',
            options: {
                baseURL: 'https://llm.corp.sldev.cz/v1',
                apiKey: process.env.BEAST_API_KEY,
            },
            models: {
                // Server id is `beast/big`; OpenCode catalog key is provider/model → beast/big.
                big: { id: 'beast/big' },
            },
        },
    },
    share: 'disabled',
    autoupdate: false,
    // No external instruction files (AGENTS.md etc.) — the prompt is the only
    // brief, so local and CI runs see the same instructions.
    instructions: [],
    lsp: false,
    formatter: false,
    plugin: [join(BOT_DIR, 'hooks/sandboxGate.mjs')],
    mcp: {
        playwright: {
            type: 'local',
            command: [
                // The workspace binary directly — npx would pay package
                // resolution on every server spawn.
                join(REPO_ROOT, 'node_modules/.bin/playwright'),
                'mcp',
                '--cdp-endpoint=http://127.0.0.1:9222',
                '--output-dir=packages/e2e-utils/src/llmExploratoryTester/reports/browser',
                '--timeout-action=12000',
            ],
        },
        'trezor-emulator': {
            type: 'remote',
            url: 'http://127.0.0.1:9003/sse',
            oauth: false,
        },
    },
    permission: {
        bash: 'deny',
        edit: 'deny',
        webfetch: 'deny',
        external_directory: 'deny',
        // Nobody answers the agent's questions in a headless run — an
        // unanswered one would hang the session until the kill timer.
        question: 'deny',
    },
    experimental: {
        // A denied tool call must not kill the turn; the agent should route
        // around the sandbox and carry on.
        continue_loop_on_deny: true,
    },
    // MCP tool denies live in hooks/sandboxGate.mjs — this map does not gate
    // MCP tools in OpenCode 1.18 (denied MCP tools stay callable).
    tools: {
        bash: false,
        edit: false,
        write: false,
        glob: false,
        grep: false,
        webfetch: false,
        websearch: false,
        read: true,
    },
};
