import { SignClient as SignClientClass } from '@walletconnect/sign-client';
import type { EngineTypes, ISignClient, SessionTypes, SignClientTypes } from '@walletconnect/types';

export const CLIENT_METADATA: SignClientTypes.Metadata = {
    name: 'Trezor E2E Test',
    description: 'Internal Testing',
    url: 'https://trezor.io',
    icons: ['https://trezor.io/static/images/logo.png'],
};

export const CONNECT_PARAMS: EngineTypes.ConnectParams = {
    optionalNamespaces: {
        // Ethereum
        eip155: {
            methods: ['eth_sendTransaction', 'personal_sign'],
            chains: ['eip155:1'],
            events: ['chainChanged', 'accountsChanged'],
        },
    },
};

const projectId = 'ff166fd793f2da788f3518714a227814';

/**
 * A wrapper for the WalletConnect SignClient.
 *
 * ARCHITECTURE & LIFECYCLE:
 * 1. Worker-Scoped Initialization: The client is initialized once per Playwright worker process.
 *    This is mandatory because the WalletConnect library provides an `init()` method but no
 *    corresponding `uninit()`. Initializing multiple times in the same process can corrupt state.
 * 2. Per-Test Connection: Each test initiates a new session proposal via `connect()`.
 *    While the core client is stable and shared, each connection generates a unique URI.
 * 3. Isolation: Playwright's browser isolation destroys WebSockets and IndexedDB at the end of each test,
 *    but session state may persist in the SignClient until explicitly disconnected.
 * 4. Final Teardown: `disconnect()` is called once during worker teardown to close all active sessions.
 */
export class WalletConnectSignClient {
    private client: ISignClient | null = null;

    /**
     * Initializes the core singleton client in the Node.js worker process.
     * This sets up the project ID and configuration. It does NOT create browser-specific
     * resources (like WebSockets or IndexedDB) yet; those are handled during the `connect()` phase.
     *
     * @param metadata - Application metadata to be displayed in the connected wallet.
     */
    async init(metadata: SignClientTypes.Metadata = CLIENT_METADATA): Promise<void> {
        this.client = await SignClientClass.init({
            projectId,
            metadata,
            logger: 'silent',
        });
    }

    /**
     * Ensures the client is initialized before performing operations.
     *
     * @throws Error if init() has not been called.
     */
    private getClient() {
        if (!this.client) {
            throw new Error('WalletConnect client not initialized. Call init() first.');
        }

        return this.client;
    }

    /**
     * Initiates a new session proposal for a specific test.
     * This creates browser-specific resources (WebSocket, IndexedDB) in the browser context
     * and generates a unique URI used for the connection. Because the client instance is stable,
     * it can handle multiple distinct proposals without interference.
     *
     * @param connectParams - Configuration for requested namespaces and chains.
     * @returns An object containing the connection URI and an approval function.
     * @throws Error if URI generation fails.
     */
    async connect(connectParams: EngineTypes.ConnectParams = CONNECT_PARAMS): Promise<{
        uri: string;
        approval: () => Promise<SessionTypes.Struct>;
    }> {
        const client = this.getClient();
        const { uri, approval } = await client.connect(connectParams);

        if (!uri) {
            throw new Error('Failed to generate WalletConnect URI.');
        }

        return { uri, approval };
    }

    /**
     * Terminates all existing sessions created during the worker's lifetime.
     * This is called during final worker teardown to ensure no hanging sessions remain.
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            const sessions = this.client.session.getAll();

            for (const session of sessions) {
                try {
                    await this.client.disconnect({
                        topic: session.topic,
                        reason: { code: -1, message: 'Disconnect SignClient session.' },
                    });
                } catch (e) {
                    // The session might have already been terminated by the app.
                    // Log a warning and continue the cleanup.
                    console.warn(
                        `Could not disconnect session ${session.topic}: ${(e as Error).message}`,
                    );
                }
            }
            this.client = null;
        }
    }
}
