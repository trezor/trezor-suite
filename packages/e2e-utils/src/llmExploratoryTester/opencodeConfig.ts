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

// The server runs with an isolated XDG_CONFIG_HOME (see runOpencode.ts), so
// no global opencode.json is merged in; enabled_providers is set anyway so a
// stray allowlist can never disable OpenRouter.
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
    // Wildcard deny means no action ever prompts, so runOpencode.ts needs no
    // permission handler — unlisted actions are blocked before execution.
    // MCP tools are not gated by this map in OpenCode 1.18 (denied MCP tools
    // stay callable); hooks/sandboxGate.mjs enforces those.
    permission: {
        // @ts-expect-error OpenCode supports the '*' default; the v1 SDK types omit it.
        '*': 'deny',
        read: 'allow',
        todowrite: 'allow',
    },
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
