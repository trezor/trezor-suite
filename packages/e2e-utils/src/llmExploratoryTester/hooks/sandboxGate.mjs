import { resolve } from 'node:path';

const CONTEXT_IMAGES_DIR = 'packages/e2e-utils/src/llmExploratoryTester/reports/context-images';
const BROWSER_DIR = 'packages/e2e-utils/src/llmExploratoryTester/reports/browser';

// The opencode `tools` config map does not gate MCP tools (1.18) — denied MCP
// tools stay callable — so enforcement lives here, and it is an allowlist:
// anything not named is denied, so a tool added by a future playwright-mcp or
// emulator release is blocked by default instead of slipping through. The
// agent is a black-box QA tester: snapshot-driven UI interaction, console and
// network inspection, screenshots, and the emulator's device prompts. Denied
// is everything else — running JS in the page, leaving or destroying the
// onboarded session, mutating stored app state (reading it is fine), mocking
// the network, managing the browser itself, and the emulator lifecycle that
// would destroy or replace the seeded device.
const ALLOWED_TOOLS = new Set([
    // OpenCode builtins the agent needs: read is further restricted to the
    // context-images dir below; todowrite tracks the coverage checklist.
    'read',
    'todowrite',
    'todoread',
    // Snapshot-driven black-box interaction.
    'playwright_browser_snapshot',
    'playwright_browser_click',
    'playwright_browser_type',
    'playwright_browser_fill_form',
    'playwright_browser_press_key',
    'playwright_browser_press_sequentially',
    'playwright_browser_keydown',
    'playwright_browser_keyup',
    'playwright_browser_hover',
    'playwright_browser_select_option',
    'playwright_browser_check',
    'playwright_browser_uncheck',
    'playwright_browser_drag',
    'playwright_browser_mouse_click_xy',
    'playwright_browser_mouse_down',
    'playwright_browser_mouse_up',
    'playwright_browser_mouse_move_xy',
    'playwright_browser_mouse_drag_xy',
    'playwright_browser_mouse_wheel',
    'playwright_browser_handle_dialog',
    'playwright_browser_wait_for',
    // Tabs are further restricted to list/select below.
    'playwright_browser_tabs',
    // Inspection a black-box tester is allowed: console, network, storage
    // reads, and element verification. No JS eval, no route/mock.
    'playwright_browser_console_messages',
    'playwright_browser_network_requests',
    'playwright_browser_network_request',
    'playwright_browser_localstorage_get',
    'playwright_browser_localstorage_list',
    'playwright_browser_sessionstorage_get',
    'playwright_browser_sessionstorage_list',
    'playwright_browser_cookie_get',
    'playwright_browser_cookie_list',
    'playwright_browser_verify_element_visible',
    'playwright_browser_verify_list_visible',
    'playwright_browser_verify_text_visible',
    'playwright_browser_verify_value',
    // PNG evidence, further restricted to the browser reports dir below.
    'playwright_browser_take_screenshot',
    // Device prompts and recoverable disconnect testing. The lifecycle that
    // destroys or replaces the seeded device (wipe/setup/apply_settings/
    // start_from_*) stays denied.
    'trezor-emulator_bridge_start',
    'trezor-emulator_bridge_stop',
    'trezor-emulator_emulator_start',
    'trezor-emulator_emulator_stop',
    'trezor-emulator_emulator_click',
    'trezor-emulator_emulator_swipe',
    'trezor-emulator_emulator_press_yes',
    'trezor-emulator_emulator_press_no',
    'trezor-emulator_emulator_input',
    'trezor-emulator_emulator_get_features',
    'trezor-emulator_emulator_get_debug_state',
    'trezor-emulator_emulator_screenshot',
    'trezor-emulator_emulator_ping',
]);

// The gate runs in the OpenCode server process, whose cwd is the repo root
// (runOpencode chdirs before spawning). resolve() collapses `..` and accepts
// both relative and absolute paths, so a lookalike prefix or an escape
// segment cannot pass.
function isInside(filePath, dir) {
    const resolvedPath = resolve(String(filePath));
    const resolvedDir = resolve(dir);

    return resolvedPath.startsWith(`${resolvedDir}/`);
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

        if (!ALLOWED_TOOLS.has(toolName)) {
            throw new Error(`${toolName} is disabled in this harness`);
        }

        if (toolName === 'read') {
            const filePath = String(arg(args, 'filePath', 'file_path'));
            if (!isInside(filePath, CONTEXT_IMAGES_DIR)) {
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
            if (!isInside(filename, BROWSER_DIR) || !filename.endsWith('.png')) {
                throw new Error(
                    `browser_take_screenshot blocked: ${filename || 'missing filename'}`,
                );
            }
        }
    },
});
