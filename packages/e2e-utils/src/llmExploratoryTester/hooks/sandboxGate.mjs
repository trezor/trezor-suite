const CONTEXT_IMAGES_DIR = 'packages/e2e-utils/src/llmExploratoryTester/reports/context-images';
const BROWSER_DIR = 'packages/e2e-utils/src/llmExploratoryTester/reports/browser';

// The opencode `tools` config map does not gate MCP tools (1.18) — denied MCP
// tools stay callable — so enforcement lives here. The agent is a black-box QA
// tester: console, network inspection, forms, keyboard/mouse and dialogs stay
// available. Denied is only what no black-box tester should do: run JS in the
// page, leave or destroy the onboarded session, mutate stored app state
// (reading it is fine), mock the network, or manage the browser itself.
const DENIED_TOOLS = new Set([
    // Arbitrary code / exfiltration — not black-box testing.
    'playwright_browser_evaluate',
    'playwright_browser_run_code_unsafe',
    'playwright_browser_file_upload',
    // Would leave Suite or destroy the onboarded session (AGENT.md rules).
    'playwright_browser_navigate',
    'playwright_browser_navigate_back',
    'playwright_browser_navigate_forward',
    'playwright_browser_reload',
    'playwright_browser_close',
    'playwright_browser_drop',
    'playwright_browser_resume',
    // Browser/session plumbing the harness owns.
    'playwright_browser_get_config',
    'playwright_browser_set_storage_state',
    'playwright_browser_storage_state',
    // Storage/cookie mutation risks the session; the get/list reads stay allowed.
    'playwright_browser_localstorage_clear',
    'playwright_browser_localstorage_delete',
    'playwright_browser_localstorage_set',
    'playwright_browser_sessionstorage_clear',
    'playwright_browser_sessionstorage_delete',
    'playwright_browser_sessionstorage_set',
    'playwright_browser_cookie_clear',
    'playwright_browser_cookie_delete',
    'playwright_browser_cookie_set',
    // Mocking would falsify black-box results.
    'playwright_browser_route',
    'playwright_browser_route_list',
    'playwright_browser_unroute',
    // Test-authoring tools, not QA.
    'playwright_browser_annotate',
    'playwright_browser_highlight',
    'playwright_browser_hide_highlight',
    'playwright_browser_generate_locator',
    // Heavy artifacts — PNG screenshots are the evidence format.
    'playwright_browser_pdf_save',
    'playwright_browser_start_tracing',
    'playwright_browser_stop_tracing',
    'playwright_browser_start_video',
    'playwright_browser_stop_video',
    'playwright_browser_video_chapter',
    'playwright_browser_video_hide_actions',
    'playwright_browser_video_show_actions',
    // Emulator lifecycle the harness owns. bridge_stop/start and
    // emulator_stop/start stay allowed for disconnect testing; these destroy
    // or replace the seeded device.
    'trezor-emulator_emulator_wipe',
    'trezor-emulator_emulator_setup',
    'trezor-emulator_emulator_apply_settings',
    'trezor-emulator_emulator_start_from_branch',
    'trezor-emulator_emulator_start_from_url',
]);

function isInside(filePath, dir) {
    const normalized = String(filePath).replaceAll('\\', '/');

    return normalized.startsWith(`${dir}/`) || normalized.includes(`/${dir}/`);
}

function arg(args, ...keys) {
    for (const key of keys) {
        if (args[key] !== undefined) {
            return args[key];
        }
    }

    return '';
}

export const sandboxGate = () => ({
    'tool.execute.before': (input, output) => {
        const toolName = String(input.tool ?? '');
        const args = output.args ?? {};

        if (DENIED_TOOLS.has(toolName)) {
            throw new Error(`${toolName} is disabled in this harness`);
        }

        if (toolName === 'read' || toolName === 'Read') {
            const filePath = String(arg(args, 'filePath', 'file_path'));
            if (filePath.includes('..') || !isInside(filePath, CONTEXT_IMAGES_DIR)) {
                throw new Error(`Read blocked: ${filePath || 'missing file_path'}`);
            }
        }

        if (toolName.endsWith('browser_tabs')) {
            const action = String(arg(args, 'action'));
            if (action !== 'list' && action !== 'select') {
                throw new Error(`browser_tabs ${action || 'missing action'} blocked`);
            }
        }

        if (toolName.endsWith('browser_take_screenshot')) {
            const filename = String(arg(args, 'filename'));
            if (
                filename.includes('..') ||
                !filename.startsWith(`${BROWSER_DIR}/`) ||
                !filename.endsWith('.png')
            ) {
                throw new Error(
                    `browser_take_screenshot blocked: ${filename || 'missing filename'}`,
                );
            }
        }
    },
});
