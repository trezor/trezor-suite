import { txListener } from './txListener';
import { addressToScripthash } from '../utils/transform';

// The Electrum server is an untrusted, user-selectable backend (including custom addresses).
// `onTransaction` is an async subscription handler: unlike the synchronous block listener (whose
// throws are caught by the JsonRpcClient.response() try/catch around emit()), any throw here is
// converted into a rejected promise that emit() ignores — surfacing as an unhandledRejection that
// crashes the worker (remote DoS). A malformed notification param or a misshapen get_history
// response must therefore be dropped, not allowed to reject.
describe('Electrum txListener malformed-notification handling', () => {
    // A valid mainnet P2PKH address so addressManager.addAddresses can derive a scripthash and
    // subscribe() actually registers the onTransaction handler.
    const VALID_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

    const createHarness = () => {
        let onTransaction: ((notification: unknown) => Promise<void>) | undefined;
        const request = jest.fn().mockResolvedValue(undefined);
        const subscriptions = new Set<string>();
        const api = {
            getInfo: () => ({ network: undefined }),
            on: (_event: string, listener: (notification: unknown) => Promise<void>) => {
                onTransaction = listener;
            },
            off: jest.fn(),
            request,
        };
        const state = {
            getSubscription: (type: string) => subscriptions.has(type),
            addSubscription: (type: string) => subscriptions.add(type),
            removeSubscription: (type: string) => subscriptions.delete(type),
        };
        const post = jest.fn();
        const debug = jest.fn();
        const worker = { api, state, post, debug } as any;

        return { worker, request, post, debug, getHandler: () => onTransaction };
    };

    const subscribe = async (harness: ReturnType<typeof createHarness>) => {
        await txListener(harness.worker).subscribe({
            type: 'addresses',
            addresses: [VALID_ADDRESS],
        } as any);
        const handler = harness.getHandler();
        if (!handler) throw new Error('onTransaction handler was not registered');

        return handler;
    };

    it('does not reject when the notification param is not an array', async () => {
        const harness = createHarness();
        const handler = await subscribe(harness);

        // A malformed subscription notification: destructuring `const [scripthash] = null` throws.
        await expect(handler(null)).resolves.toBeUndefined();
        expect(harness.post).not.toHaveBeenCalled();
        expect(harness.debug).toHaveBeenCalled();
    });

    it('does not reject when get_history returns a non-array response', async () => {
        const harness = createHarness();
        const handler = await subscribe(harness);

        // Reach the async await: emit a well-formed notification for the subscribed scripthash so
        // getInfo() resolves a descriptor != scripthash, then have the untrusted server answer
        // get_history with `null` — `null.reduce(...)` throws inside the async handler.
        const scripthash = addressToScripthash(VALID_ADDRESS);
        harness.request.mockResolvedValue(null);

        await expect(handler([scripthash, 'new-status'])).resolves.toBeUndefined();
        expect(harness.post).not.toHaveBeenCalled();
        expect(harness.debug).toHaveBeenCalled();
    });
});
