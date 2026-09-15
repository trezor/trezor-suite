import { type Config } from '@opencode-ai/sdk/v2';
import { join } from 'node:path';

import { BOT_DIR, BROWSER_RELATIVE_DIR, REPO_ROOT } from './paths';

export const MODEL = {
    providerID: 'openrouter',
    modelID: process.env.LLM_EXPLORATORY_TESTER_MODEL ?? 'openai/gpt-5.6-luna',
};

// Applied as the prompt `variant`; OpenRouter ignores provider `options` for effort.
export const REASONING_EFFORT = process.env.LLM_EXPLORATORY_TESTER_EFFORT ?? 'high';

// A global enabled_providers allowlist would otherwise silently disable OpenRouter.
export const OPENCODE_CONFIG: Config = {
    model: `${MODEL.providerID}/${MODEL.modelID}`,
    enabled_providers: [MODEL.providerID],
    // OpenCode drops screenshots unless the model is declared image-capable.
    provider: {
        [MODEL.providerID]: {
            // Maps the session ID to OpenRouter's prompt_cache_key.
            options: { setCacheKey: true },
            models: {
                [MODEL.modelID]: {
                    attachment: true,
                    modalities: { input: ['text', 'image'], output: ['text'] },
                },
            },
        },
    },
    share: 'disabled',
    autoupdate: false,
    // Empty so a local AGENTS.md is not mixed into the prompt.
    instructions: [],
    lsp: false,
    formatter: false,
    plugin: [join(BOT_DIR, 'hooks/sandboxGate.ts')],
    mcp: {
        playwright: {
            type: 'local',
            command: [
                join(REPO_ROOT, 'node_modules/.bin/playwright'),
                'mcp',
                '--cdp-endpoint=http://127.0.0.1:9222',
                `--output-dir=${BROWSER_RELATIVE_DIR}`,
                '--timeout-action=12000',
                // Unlabeled tooltip icons are not snapshot refs; vision enables mouse_move_xy.
                '--caps=vision',
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
        // An unanswered question hangs a headless run.
        question: 'deny',
    },
    experimental: {
        // Denied tools must not abort the turn.
        continue_loop_on_deny: true,
    },
    // This map does not gate MCP tools in OpenCode 1.18; see sandboxGate.ts.
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
