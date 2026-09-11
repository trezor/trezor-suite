import { type Config } from '@opencode-ai/sdk';
import { join } from 'node:path';

import { BOT_DIR } from './paths';

export const MODEL = {
    providerID: 'openrouter',
    // Overridable for A/B testing, like REASONING_EFFORT below.
    modelID: process.env.LLM_EXPLORATORY_TESTER_MODEL ?? 'openai/gpt-5.6-luna',
};

// Reasoning effort, applied per request as the opencode variant (see
// runOpencode.ts) — the only path that reaches the model. The provider
// `options` path is silently ignored for OpenRouter (verified by probe:
// identical reasoning tokens with/without). Override with
// LLM_EXPLORATORY_TESTER_EFFORT; low/high are the safe variant names.
export const REASONING_EFFORT = process.env.LLM_EXPLORATORY_TESTER_EFFORT ?? 'high';

// Merged over the user's global opencode.json; enabled_providers must be set
// here or a global allowlist silently disables OpenRouter.
export const OPENCODE_CONFIG: Config = {
    model: `${MODEL.providerID}/${MODEL.modelID}`,
    enabled_providers: [MODEL.providerID],
    // Sends the opencode session ID as OpenRouter's prompt_cache_key, so the
    // OpenRouter console groups the run's requests under the ID we log.
    provider: {
        [MODEL.providerID]: {
            options: { setCacheKey: true },
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
                'npx',
                'playwright',
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
