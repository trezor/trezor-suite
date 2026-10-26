import * as net from 'net';

// Store IPC handlers registered by the module
const ipcHandlers: Record<string, (...args: any[]) => any> = {};

/** Find a free port by briefly binding to port 0 */
const getFreePort = (): Promise<number> =>
    new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const addr = srv.address() as net.AddressInfo;
            srv.close(() => resolve(addr.port));
        });
        srv.on('error', reject);
    });

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

jest.mock('@trezor/ipc-proxy', () => ({
    validateIpcMessage: jest.fn(),
}));

jest.mock('@trezor/node-utils', () => ({
    findProcessFromIncomingPort: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../libs/connect-popup-messages', () => ({
    addMessage: jest.fn().mockImplementation(() => {
        let resolve: (value: unknown) => void;
        const promise = new Promise<unknown>(r => {
            resolve = r;
        });

        return { promise, resolve: resolve! };
    }),
}));

jest.mock('../libs/process-icon', () => ({
    getProcessIcon: jest.fn().mockResolvedValue(undefined),
}));

import { findProcessFromIncomingPort } from '@trezor/node-utils';

import { init } from './mcp-server';
import { addMessage } from '../libs/connect-popup-messages';

const TEST_TOKEN = 'test-token-abc123';

const createMockStore = (overrides?: Partial<McpSettings>) => {
    const settings = {
        enabled: true,
        port: 0, // OS assigns free port
        token: TEST_TOKEN as string | undefined,
        ...overrides,
    };

    return {
        getMcpSettings: jest.fn(() => settings),
        setMcpSettings: jest.fn((partial: Partial<McpSettings>) => {
            Object.assign(settings, partial);
        }),
    };
};

const createMockMainWindowProxy = (hasWindow = true) => {
    // The same window across calls, so a test can read what was sent to it.
    const mainWindow = hasWindow
        ? {
              webContents: { send: jest.fn() },
              isDestroyed: () => false,
          }
        : undefined;

    return { getInstance: jest.fn(() => mainWindow) };
};

/**
 * Start an MCP server on a free port and return the port + cleanup function.
 */
const startMcpServer = async (overrides?: {
    storeOverrides?: Partial<McpSettings>;
    hasWindow?: boolean;
}) => {
    // Clear previously registered handlers so each test is independent
    Object.keys(ipcHandlers).forEach(key => delete ipcHandlers[key]);

    const port = await getFreePort();
    const store = createMockStore({ port, ...overrides?.storeOverrides });
    const mainWindowProxy = createMockMainWindowProxy(overrides?.hasWindow ?? true);
    const logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const result = init({
        mainWindowProxy,
        store,
        interceptor: {} as any,
        mainThreadEmitter: {} as any,
        cspNonce: 'test-nonce',
        logger,
    } as any);

    result!.onLoad({} as any);

    // Wait for the server to start listening
    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Server did not start in time')), 3000);
        const check = () => {
            const getSettings = ipcHandlers['mcp/get-settings'];
            if (getSettings) {
                const settings = getSettings({});
                if (settings?.running) {
                    clearTimeout(timeout);
                    resolve();

                    return;
                }
            }
            setTimeout(check, 10);
        };
        setTimeout(check, 20);
    });

    return {
        port,
        store,
        mainWindowProxy,
        logger,
        cleanup: () => result?.onQuit?.(),
    };
};

const mcpFetch = (
    port: number,
    body?: Record<string, unknown> | string | null,
    options: {
        token?: string | null;
        sessionId?: string | null;
        method?: string;
        path?: string;
    } = {},
) => {
    const { token = TEST_TOKEN, sessionId, method = 'POST', path = '/mcp' } = options;

    const headers: Record<string, string> = {};
    if (token !== null) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId !== null && sessionId !== undefined) {
        headers['Mcp-Session-Id'] = sessionId;
    }
    if (body !== null && body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const fetchOptions: RequestInit = { method, headers };
    if (body !== null && body !== undefined && method !== 'GET' && method !== 'DELETE') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return fetch(`http://127.0.0.1:${port}${path}`, fetchOptions);
};

const jsonRpc = (method: string, params?: Record<string, unknown>, id: string | number = 1) => ({
    jsonrpc: '2.0',
    id,
    method,
    params,
});

const jsonRpcNotification = (method: string, params?: Record<string, unknown>) => ({
    jsonrpc: '2.0',
    method,
    params,
});

const waitFor = async (condition: () => boolean) => {
    for (let attempt = 0; attempt < 300; attempt++) {
        if (condition()) return;
        await new Promise(resolve => {
            setTimeout(resolve, 10);
        });
    }
    throw new Error('Condition was not met in time');
};

describe('MCP server', () => {
    let cleanup: (() => void) | undefined;

    afterEach(() => {
        cleanup?.();
        cleanup = undefined;
    });

    describe('authentication', () => {
        it('rejects requests without Authorization header with 401', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'), { token: null });

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toContain('Unauthorized');
        });

        it('rejects requests with wrong token with 401', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'), {
                token: 'wrong-token',
            });

            expect(res.status).toBe(401);
        });

        it('accepts requests with correct Bearer token', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'));

            expect(res.status).toBe(200);
        });

        it('accepts requests with token in query parameter', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'), {
                token: null,
                path: `/mcp?token=${TEST_TOKEN}`,
            });

            expect(res.status).toBe(200);
        });

        it('rejects requests with wrong query parameter token', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'), {
                token: null,
                path: '/mcp?token=wrong-token',
            });

            expect(res.status).toBe(401);
        });

        it('returns 500 when store returns empty token at request time', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            // Override getMcpSettings to return no token after server has started
            server.store.getMcpSettings.mockReturnValue({
                enabled: true,
                port: server.port,
                token: '',
            });

            const res = await mcpFetch(server.port, jsonRpc('initialize'), { token: null });

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toContain('no auth token');
        });
    });

    describe('request routing', () => {
        it('OPTIONS /mcp returns 405', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, null, { method: 'OPTIONS' });

            expect(res.status).toBe(405);
        });

        it('GET /mcp returns 405', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, null, { method: 'GET' });

            expect(res.status).toBe(405);
        });

        it('DELETE /mcp returns 200 and clears session', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, null, { method: 'DELETE' });

            expect(res.status).toBe(200);
        });

        it('POST /other returns 404', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'), { path: '/other' });

            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body.error).toContain('Not found');
        });

        it('PUT /mcp returns 404', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, null, { method: 'PUT' });

            expect(res.status).toBe(404);
        });
    });

    describe('body parsing and size limit', () => {
        it('parses valid JSON body', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'));

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.result).toBeDefined();
        });

        it('rejects body larger than 1MB with 413', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const largeBody = JSON.stringify({ data: 'x'.repeat(1024 * 1024 + 1) });

            const res = await mcpFetch(server.port, largeBody);

            expect(res.status).toBe(413);
            const body = await res.json();
            expect(body.error.code).toBe(-32600);
            expect(body.error.message).toBe('Payload too large');
        });

        it('rejects invalid JSON with 400', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, '{invalid json!!!');

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error.code).toBe(-32700);
            expect(body.error.message).toBe('Parse error');
        });

        it('treats empty body as empty object', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await fetch(`http://127.0.0.1:${server.port}/mcp`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${TEST_TOKEN}` },
            });

            // Empty body → {} → method is undefined → 202 (notification, no id)
            expect(res.status).toBe(202);
        });
    });

    describe('session management', () => {
        it('initialize returns Mcp-Session-Id header', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'));

            expect(res.status).toBe(200);
            const sessionId = res.headers.get('mcp-session-id');
            expect(sessionId).toBeTruthy();
            expect(typeof sessionId).toBe('string');
        });

        it('accepts subsequent request with correct session ID', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await mcpFetch(server.port, jsonRpc('tools/list', undefined, 2), {
                sessionId,
            });

            expect(res.status).toBe(200);
        });

        it('rejects request with wrong session ID with 404', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            await mcpFetch(server.port, jsonRpc('initialize'));

            const res = await mcpFetch(server.port, jsonRpc('tools/list', undefined, 2), {
                sessionId: 'wrong-session-id',
            });

            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body.error).toBe('Session not found');
        });

        it('rejects non-initialize request without session ID with 404', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            await mcpFetch(server.port, jsonRpc('initialize'));

            const res = await mcpFetch(server.port, jsonRpc('tools/list', undefined, 2));

            expect(res.status).toBe(404);
        });

        it('allows re-initialization without session ID (new client connecting)', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            await mcpFetch(server.port, jsonRpc('initialize'));

            const res = await mcpFetch(server.port, jsonRpc('initialize', undefined, 2));

            expect(res.status).toBe(200);
        });

        it('identifies the client by its declared name when the process has no path', async () => {
            // The Linux lookup reports an empty path when it cannot read /proc/<pid>/exe, and
            // leaves only the name the process picked for its own kernel task.
            (findProcessFromIncomingPort as jest.Mock).mockResolvedValueOnce({
                name: 'node',
                pid: '1',
                fullPath: '',
                warning: true,
            });
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(
                server.port,
                jsonRpc('initialize', { clientInfo: { name: 'Claude Code' } }),
            );

            expect(res.status).toBe(200);
            expect(server.logger.info).toHaveBeenCalledWith(
                'mcp-server',
                'Session initialized for process: Claude Code',
            );
        });

        it('keeps the pathless process name when the client declared none', async () => {
            (findProcessFromIncomingPort as jest.Mock).mockResolvedValueOnce({
                name: 'node',
                pid: '1',
                fullPath: '',
                warning: true,
            });
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'));

            expect(res.status).toBe(200);
            expect(server.logger.info).toHaveBeenCalledWith(
                'mcp-server',
                'Session initialized for process: node',
            );
        });

        it('allows re-initialization after DELETE', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            await mcpFetch(server.port, jsonRpc('initialize'));

            const deleteRes = await mcpFetch(server.port, null, { method: 'DELETE' });
            expect(deleteRes.status).toBe(200);

            const res = await mcpFetch(server.port, jsonRpc('initialize'));
            expect(res.status).toBe(200);

            const newSessionId = res.headers.get('mcp-session-id');
            expect(newSessionId).toBeTruthy();
        });
    });

    describe('JSON-RPC method handling', () => {
        it('initialize returns protocol version, server info, and capabilities', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const res = await mcpFetch(server.port, jsonRpc('initialize'));
            const body = await res.json();

            expect(body.jsonrpc).toBe('2.0');
            expect(body.id).toBe(1);
            expect(body.result.protocolVersion).toBe('2025-03-26');
            expect(body.result.serverInfo.name).toBe('trezor-suite-mcp-server');
            expect(body.result.serverInfo.version).toBe('1.0.0');
            expect(body.result.capabilities).toEqual({ tools: {} });
        });

        it('tools/list returns array of tool definitions', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await mcpFetch(server.port, jsonRpc('tools/list', undefined, 2), {
                sessionId,
            });
            const body = await res.json();

            expect(Array.isArray(body.result.tools)).toBe(true);
            expect(body.result.tools.length).toBeGreaterThan(0);

            const tool = body.result.tools[0];
            expect(tool).toHaveProperty('name');
            expect(tool).toHaveProperty('description');
            expect(tool).toHaveProperty('inputSchema');
            expect(tool).toHaveProperty('annotations');

            const toolNames = body.result.tools.map((t: { name: string }) => t.name);
            expect(toolNames).toContain('trezor_get_address');
            expect(toolNames).toContain('trezor_send_transaction');
            expect(toolNames).toContain('trezor_get_account_info');
        });

        it('tools/call with unknown tool returns -32602', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await mcpFetch(
                server.port,
                jsonRpc('tools/call', { name: 'nonexistent_tool', arguments: {} }, 2),
                { sessionId },
            );
            const body = await res.json();

            expect(body.error.code).toBe(-32602);
            expect(body.error.message).toContain('Unknown tool');
        });

        it('unknown method returns -32601', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await mcpFetch(server.port, jsonRpc('unknown/method', undefined, 2), {
                sessionId,
            });
            const body = await res.json();

            expect(body.error.code).toBe(-32601);
            expect(body.error.message).toContain('Method not found');
        });

        it('notification (no id) returns 202 with no body', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await mcpFetch(
                server.port,
                jsonRpcNotification('notifications/initialized'),
                { sessionId },
            );

            expect(res.status).toBe(202);
            const text = await res.text();
            expect(text).toBe('');
        });
    });

    describe('calling process', () => {
        const popupCall = (mainWindowProxy: ReturnType<typeof createMockMainWindowProxy>) =>
            mainWindowProxy.getInstance()?.webContents.send.mock.calls[0]?.[1];

        const lastPopupDeferred = () =>
            (addMessage as jest.Mock).mock.results.at(-1)!.value as {
                resolve: (value: unknown) => void;
            };

        // Initializes a session with the given clientInfo and returns the popup call that
        // a permission-requiring tool call then sent to the renderer.
        const popupCallOfClient = async (clientInfo?: Record<string, unknown>) => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize', { clientInfo }));
            const sessionId = initRes.headers.get('mcp-session-id')!;
            const callRes = mcpFetch(
                server.port,
                jsonRpc('tools/call', {
                    name: 'trezor_get_address',
                    arguments: { coin: 'btc' },
                }),
                { sessionId },
            );
            await waitFor(() => popupCall(server.mainWindowProxy) !== undefined);
            const call = popupCall(server.mainWindowProxy);
            // Answer the popup, so that the request the call belongs to can finish.
            lastPopupDeferred().resolve({ success: false, error: 'cancelled' });
            await callRes;

            return call;
        };

        it('names the client by its declared clientInfo when the executable path is unknown', async () => {
            (findProcessFromIncomingPort as jest.Mock).mockResolvedValueOnce({
                name: 'node',
                pid: '300',
                fullPath: '',
                warning: true,
            });

            const call = await popupCallOfClient({ name: 'Claude Code', version: '1.0.0' });

            expect(call.process).toEqual({
                name: 'Claude Code',
                fullPath: '',
                // The one thing the lookup did observe about the caller.
                observedName: 'node',
                warning: true,
            });
        });

        it('ignores a declared name that is not a string', async () => {
            // The body is parsed JSON from a local caller, and the name ends up as a React child
            // in the consent prompt, where an object would throw.
            (findProcessFromIncomingPort as jest.Mock).mockResolvedValueOnce({
                name: 'node',
                pid: '300',
                fullPath: '/usr/bin/node',
                warning: false,
            });

            const call = await popupCallOfClient({ name: {} });

            expect(call.process.name).toBe('node');
            expect(call.manifest.appName).toBe('MCP Agent');
        });

        it('keeps the path of a client the lookup did not find at all empty', async () => {
            // No lsof line for the client endpoint, no lsof installed, or a process of another
            // user: the declared name is all there is, and it is not a path.
            (findProcessFromIncomingPort as jest.Mock).mockResolvedValueOnce(undefined);

            const call = await popupCallOfClient({ name: 'Claude Code', version: '1.0.0' });

            expect(call.process).toEqual({
                name: 'Claude Code',
                fullPath: '',
                warning: true,
            });
        });
    });

    describe('ERC-20 token transfer validation', () => {
        const callSendTransaction = (
            port: number,
            sessionId: string,
            args: Record<string, unknown>,
        ) =>
            mcpFetch(
                port,
                jsonRpc('tools/call', {
                    name: 'trezor_send_transaction',
                    arguments: args,
                }),
                { sessionId },
            );

        it('rejects ERC-20 transfer with missing tokenDecimals', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await callSendTransaction(server.port, sessionId, {
                coin: 'eth',
                to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                value: '10',
                tokenContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            });

            const body = await res.json();
            expect(body.result.isError).toBe(true);
            expect(body.result.content[0].text).toContain('tokenDecimals');
        });

        it('rejects ERC-20 transfer with invalid recipient address', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await callSendTransaction(server.port, sessionId, {
                coin: 'eth',
                to: 'not-an-address',
                value: '10',
                tokenContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenDecimals: 6,
            });

            const body = await res.json();
            expect(body.result.isError).toBe(true);
            expect(body.result.content[0].text).toContain('valid EVM address');
        });

        it('rejects ERC-20 transfer with non-numeric value', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await callSendTransaction(server.port, sessionId, {
                coin: 'eth',
                to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                value: 'abc',
                tokenContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenDecimals: 6,
            });

            const body = await res.json();
            expect(body.result.isError).toBe(true);
            expect(body.result.content[0].text).toContain('non-negative decimal');
        });

        it('rejects ERC-20 transfer with too many fractional digits', async () => {
            const server = await startMcpServer();
            cleanup = server.cleanup;

            const initRes = await mcpFetch(server.port, jsonRpc('initialize'));
            const sessionId = initRes.headers.get('mcp-session-id')!;

            const res = await callSendTransaction(server.port, sessionId, {
                coin: 'eth',
                to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                value: '1.1234567',
                tokenContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenDecimals: 6,
            });

            const body = await res.json();
            expect(body.result.isError).toBe(true);
            expect(body.result.content[0].text).toContain('too many fractional digits');
        });
    });
});
