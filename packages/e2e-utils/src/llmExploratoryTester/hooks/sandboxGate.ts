import { resolve } from 'node:path';

import { BROWSER_DIR, CONTEXT_IMAGES_DIR } from '../paths';

// OpenCode 1.18 does not apply `tools` denies to MCP, so this allowlist is the
// real gate. Unnamed tools (including future MCP additions) are denied.
const ALLOWED_TOOLS = new Set([
    'read',
    'todowrite',
    'todoread',
    'playwright_browser_snapshot',
    'playwright_browser_find',
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
    'playwright_browser_resize',
    'playwright_browser_tabs',
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
    'playwright_browser_take_screenshot',
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

type ToolExecuteBeforeInput = {
    tool?: unknown;
};

type ToolExecuteBeforeOutput = {
    args?: Record<string, unknown>;
};

type SandboxGateHooks = {
    'tool.execute.before': (input: ToolExecuteBeforeInput, output: ToolExecuteBeforeOutput) => void;
};

function isInside(filePath: string, dir: string): boolean {
    const resolvedPath = resolve(filePath);
    const resolvedDir = resolve(dir);

    return resolvedPath.startsWith(`${resolvedDir}/`);
}

function arg(args: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
        const value = args[key];
        if (value !== undefined) {
            return String(value);
        }
    }

    return '';
}

export const sandboxGate = (): SandboxGateHooks => ({
    'tool.execute.before': (input, output) => {
        const toolName = String(input.tool ?? '');
        const args = output.args ?? {};

        if (!ALLOWED_TOOLS.has(toolName)) {
            throw new Error(`${toolName} is disabled in this harness`);
        }

        if (toolName === 'read') {
            const filePath = String(arg(args, 'filePath', 'file_path'));
            const isContextImage = isInside(filePath, CONTEXT_IMAGES_DIR);
            const isBrowserPng = isInside(filePath, BROWSER_DIR) && filePath.endsWith('.png');
            if (!isContextImage && !isBrowserPng) {
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
            // Empty filename attaches the image to the model; a path must stay in BROWSER_DIR.
            const filename = String(arg(args, 'filename'));
            if (filename && (!isInside(filename, BROWSER_DIR) || !filename.endsWith('.png'))) {
                throw new Error(`browser_take_screenshot blocked: ${filename}`);
            }
        }
    },
});
