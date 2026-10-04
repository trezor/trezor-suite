import { mock } from '@suite-common/dependency-injection';
import { PathPublic } from '@trezor/transport-common';
import { ok } from '@trezor/type-utils';

import {
    type MigrationControllerDeps,
    createMigrationController,
} from './createMigrationController';
import { mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import { mockBackend, mockFundedAccount } from '../../mocks/mockBackend';
import { type MockDeviceParams, mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';
import type { BridgeConnection } from '../device/createBridgeConnection';
import type { DeviceLostReason } from '../device/deviceSession';

const DESTINATION = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';

const CHROME_ON_WINDOWS =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

type SetupParams = {
    deviceParams?: Partial<MockDeviceParams>;
    deps?: Partial<MigrationControllerDeps>;
    amounts?: string[];
};

const setup = ({
    deviceParams = {},
    deps = {},
    amounts = ['100000', '250000'],
}: SetupParams = {}) => {
    const wallet = mockWallet();
    const chain = mockBackend();
    const funded = mockFundedAccount({ chain, wallet, accountType: 'p2pkh', amounts });
    const device = mockDevice({ wallets: { '': wallet }, ...deviceParams });

    let lostReason: DeviceLostReason | undefined;
    let reportLost: ((reason: DeviceLostReason) => void) | undefined;
    const release = jest.fn(() => Promise.resolve());

    const bridge = {
        connect: mock<BridgeConnection['connect']>(() => Promise.resolve(ok('3.3.0'))),
        findDevice: mock<BridgeConnection['findDevice']>(() =>
            Promise.resolve(
                ok({
                    type: 'legacy-trezor-one',
                    descriptor: { path: PathPublic('1'), session: null, type: 0, apiType: 'usb' },
                }),
            ),
        ),
        acquire: mock<BridgeConnection['acquire']>(({ onLost }) => {
            reportLost = onLost;

            return Promise.resolve(
                ok({
                    transportCall: device.transportCall,
                    getLostReason: () => lostReason,
                    release,
                    releaseOnUnload: () => undefined,
                }),
            );
        }),
        dispose: mock<BridgeConnection['dispose']>(() => undefined),
    };

    const controllerDeps: MigrationControllerDeps = {
        bridge,
        backend: chain.backend,
        getEnvironmentInfo: () => ({ userAgent: CHROME_ON_WINDOWS, maxTouchPoints: 0 }),
        queryLocalNetworkAccess: () => Promise.resolve('granted'),
        getRandomInt: () => 5,
        ...deps,
    };
    const controller = createMigrationController(controllerDeps);

    const loseDevice = (reason: DeviceLostReason) => {
        lostReason = reason;
        reportLost?.(reason);
    };

    const reachTransfers = async () => {
        await controller.runPreflight();
        await controller.connectDevice();
        await controller.startDiscovery();
        controller.confirmDiscovery();
        await controller.submitDestination(DESTINATION);
    };

    return { controller, chain, device, bridge, release, funded, loseDevice, reachTransfers };
};

const waitUntil = async (condition: () => boolean) => {
    for (let attempt = 0; attempt < 200 && !condition(); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    if (!condition()) throw new Error('condition was not met in time');
};

describe('migration controller', () => {
    describe('preflight', () => {
        it('refuses an unsupported operating system before touching the bridge', async () => {
            const { controller, bridge } = setup({
                deps: {
                    getEnvironmentInfo: () => ({
                        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0.0.0 Safari/537.36',
                        maxTouchPoints: 0,
                    }),
                },
            });

            await controller.runPreflight();

            expect(controller.getState()).toMatchObject({
                step: 'preflight',
                preflightIssue: { type: 'unsupported-os' },
            });
            expect(bridge.connect).not.toHaveBeenCalled();
        });

        it('stops when the local network access permission is denied', async () => {
            const { controller, bridge } = setup({
                deps: { queryLocalNetworkAccess: () => Promise.resolve('denied') },
            });

            await controller.runPreflight();

            expect(controller.getState().preflightIssue).toEqual({ type: 'permission-denied' });
            expect(bridge.connect).not.toHaveBeenCalled();
        });

        it.each([
            [{ type: 'bridge-unreachable' } as const],
            [{ type: 'bridge-outdated', version: '3.2.1' } as const],
        ])('reports %j', async error => {
            const { controller, bridge } = setup({
                deps: { queryLocalNetworkAccess: () => Promise.resolve('prompt') },
            });
            bridge.connect.mockResolvedValue({ success: false, error });

            await controller.runPreflight();

            expect(controller.getState()).toMatchObject({
                step: 'preflight',
                preflightIssue: { ...error, permission: 'prompt' },
            });
        });
    });

    describe('device', () => {
        it('initializes the device first and accepts supported firmware', async () => {
            const { controller, device } = setup();

            await controller.runPreflight();
            await controller.connectDevice();

            expect(device.calls).toEqual([{ name: 'Initialize', data: {} }]);
            expect(controller.getState()).toMatchObject({
                step: 'discovery',
                device: { firmwareVersion: [1, 6, 3], hasPassphraseProtection: false },
            });
        });

        it.each([
            [{ minor_version: 7, patch_version: 0 }, 'firmware-too-new'],
            [{ minor_version: 3, patch_version: 5 }, 'firmware-too-old'],
            [{ bootloader_mode: true }, 'bootloader-mode'],
            [{ initialized: false }, 'not-initialized'],
        ])('refuses a device reporting %j and releases it', async (features, type) => {
            const { controller, release } = setup({ deviceParams: { features } });

            await controller.runPreflight();
            await controller.connectDevice();

            expect(controller.getState()).toMatchObject({ step: 'device', deviceIssue: { type } });
            expect(release).toHaveBeenCalledTimes(1);
        });

        it('leaves a newer Trezor to Trezor Suite', async () => {
            const { controller, bridge } = setup();
            bridge.findDevice.mockResolvedValue(ok({ type: 'other-trezor' }));

            await controller.runPreflight();
            await controller.connectDevice();

            expect(controller.getState().deviceIssue).toEqual({ type: 'other-trezor' });
            expect(bridge.acquire).not.toHaveBeenCalled();
        });

        it('reports a device that cannot be opened', async () => {
            const { controller, bridge } = setup();
            bridge.acquire.mockResolvedValue({ success: false, error: { type: 'unable-to-open' } });

            await controller.runPreflight();
            await controller.connectDevice();

            expect(controller.getState().deviceIssue).toEqual({ type: 'unable-to-open' });
        });
    });

    it('moves the funds from discovery to a confirmed transfer and locks the device', async () => {
        const { controller, chain, device, release, funded, reachTransfers } = setup();

        await reachTransfers();
        const [transfer] = controller.getState().transfers;
        expect(controller.getState().step).toBe('transfers');
        expect(transfer).toMatchObject({ stage: 'ready', plan: { inputs: { length: 2 } } });

        await controller.signTransfer(transfer!.key);
        const signed = controller.getState().transfers[0]!;
        expect(signed).toMatchObject({ stage: 'signed', record: { hex: expect.any(String) } });

        await controller.broadcastTransfer(signed.key);
        expect(chain.pushedTransactions).toEqual([signed.record?.hex]);
        expect(controller.getState().transfers[0]).toMatchObject({
            stage: 'broadcast',
            status: 'pending',
        });

        // The backend now shows the transfer mined: the inputs are spent by a confirmed
        // transaction that pays the destination the composed amount.
        const { descriptor } = funded.account;
        chain.utxos.set(descriptor, []);
        chain.accountInfos.set(descriptor, {
            ...chain.accountInfos.get(descriptor)!,
            history: {
                total: 3,
                unconfirmed: 0,
                transactions: [
                    mockHistoryTransaction({
                        blockHeight: 800010,
                        details: {
                            vin: signed.plan!.utxos.map((utxo, n) => ({
                                txid: utxo.txid,
                                n,
                                isAddress: true,
                                isAccountOwned: true,
                            })),
                            vout: [
                                {
                                    n: 0,
                                    isAddress: true,
                                    addresses: [DESTINATION],
                                    value: signed.plan!.amount,
                                },
                            ],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    }),
                ],
            },
        });
        await controller.refreshTransfers();
        expect(controller.getState().transfers[0]?.status).toBe('confirmed');

        await controller.finish();
        expect(device.calls.slice(-2)).toEqual([
            { name: 'Initialize', data: {} },
            { name: 'LockDevice', data: {} },
        ]);
        expect(release).toHaveBeenCalledTimes(1);
        expect(controller.getState()).toMatchObject({
            step: 'summary',
            isDeviceReleased: true,
            isDeviceLocked: true,
        });
    });

    it('asks for the PIN through the app and continues once it is entered', async () => {
        const { controller, device } = setup({ deviceParams: { pin: '12' } });
        await controller.runPreflight();
        await controller.connectDevice();

        const discovery = controller.startDiscovery();
        await waitUntil(() => controller.getState().isPinRequested);
        controller.submitPin('12');
        await discovery;

        expect(controller.getState()).toMatchObject({
            isPinRequested: false,
            walletKind: 'standard',
        });
        expect(controller.getState().accounts.length).toBeGreaterThan(0);
        expect(device.countCalls('PinMatrixAck')).toBe(1);
    });

    it('stops at a wrong PIN and sends it again only when the user asks', async () => {
        const { controller, device } = setup({ deviceParams: { pin: '12' } });
        await controller.runPreflight();
        await controller.connectDevice();

        const discovery = controller.startDiscovery();
        await waitUntil(() => controller.getState().isPinRequested);
        controller.submitPin('99');
        await discovery;

        expect(controller.getState()).toMatchObject({
            isPinRequested: false,
            discoveryError: { type: 'failure', code: 'Failure_PinInvalid' },
        });
        expect(device.countCalls('PinMatrixAck')).toBe(1);
    });

    it('keeps the passphrase out of the state the screens render', async () => {
        const hidden = mockWallet('aa'.repeat(16));
        const { controller, chain, device } = setup({
            deviceParams: { hasPassphraseProtection: true, wallets: { 'my secret': hidden } },
        });
        mockFundedAccount({ chain, wallet: hidden, accountType: 'p2pkh', amounts: ['70000'] });

        await controller.runPreflight();
        await controller.connectDevice();
        expect(controller.getState().step).toBe('passphrase');

        await controller.submitPassphrase('my secret', 'my secret');

        expect(controller.getState()).toMatchObject({
            step: 'discovery',
            walletKind: 'passphrase-normalized',
        });
        expect(JSON.stringify(controller.getState())).not.toContain('my secret');
        expect(
            device.calls.filter(({ name }) => name === 'PassphraseAck').map(({ data }) => data),
        ).toEqual([{ passphrase: 'my secret' }]);
    });

    it('does not start discovery when the two passphrase entries differ', async () => {
        const { controller, device } = setup({
            deviceParams: { hasPassphraseProtection: true },
        });
        await controller.runPreflight();
        await controller.connectDevice();

        await controller.submitPassphrase('secret', 'secrte');

        expect(controller.getState()).toMatchObject({
            step: 'passphrase',
            passphraseError: 'mismatch',
        });
        expect(device.countCalls('GetPublicKey')).toBe(0);
    });

    describe('destination', () => {
        it.each([
            ['an address of the scanned wallet', undefined, { type: 'own-address' }],
            [
                'a Taproot address',
                'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                { type: 'unsupported-format', format: 'bech32m' },
            ],
            ['something that is not an address', 'hello', { type: 'invalid' }],
        ])('refuses %s without composing anything', async (_description, address, error) => {
            const { controller, device, funded } = setup();
            await controller.runPreflight();
            await controller.connectDevice();
            await controller.startDiscovery();
            controller.confirmDiscovery();
            const callsBefore = device.calls.length;

            await controller.submitDestination(address ?? funded.utxos[0]!.address);

            expect(controller.getState()).toMatchObject({
                step: 'destination',
                destinationError: error,
                transfers: [],
            });
            expect(device.calls).toHaveLength(callsBefore);
        });

        it('refuses a bech32 address on firmware that cannot pay to it', async () => {
            const { controller } = setup({
                deviceParams: { features: { minor_version: 5, patch_version: 2 } },
            });
            await controller.runPreflight();
            await controller.connectDevice();
            await controller.startDiscovery();
            controller.confirmDiscovery();

            await controller.submitDestination('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');

            expect(controller.getState().destinationError).toEqual({
                type: 'unsupported-format',
                format: 'bech32',
            });
        });

        it('lets the address be changed only while nothing is signed', async () => {
            const { controller, reachTransfers } = setup();
            await reachTransfers();
            const [transfer] = controller.getState().transfers;

            await controller.signTransfer(transfer!.key);
            controller.editDestination();

            expect(controller.getState().step).toBe('transfers');
        });
    });

    it('replaces a transfer rejected on the device with one that has a new amount', async () => {
        const { controller, device, reachTransfers } = setup({
            deviceParams: { isOutputRejected: true },
        });
        await reachTransfers();
        const [first] = controller.getState().transfers;

        await controller.signTransfer(first!.key);

        const [second] = controller.getState().transfers;
        expect(second).toMatchObject({
            stage: 'ready',
            error: { type: 'failure', code: 'Failure_ActionCancelled' },
        });
        expect(second?.key).not.toBe(first?.key);
        expect(second?.plan?.amount).not.toBe(first?.plan?.amount);
        expect(device.countCalls('SignTx')).toBe(1);
    });

    it('keeps a signed transfer for another broadcast when the first one fails', async () => {
        const { controller, chain, device, reachTransfers } = setup();
        await reachTransfers();
        await controller.signTransfer(controller.getState().transfers[0]!.key);
        const signed = controller.getState().transfers[0]!;

        chain.backend.pushTransaction.mockResolvedValueOnce({
            success: false,
            error: { type: 'backend', message: 'rejected' },
        });
        await controller.broadcastTransfer(signed.key);
        expect(controller.getState().transfers[0]).toMatchObject({
            stage: 'signed',
            error: { type: 'broadcast-failed', message: 'rejected' },
        });

        await controller.broadcastTransfer(signed.key);

        expect(controller.getState().transfers[0]).toMatchObject({ stage: 'broadcast' });
        expect(chain.backend.pushTransaction.mock.calls).toEqual([
            [signed.record?.hex],
            [signed.record?.hex],
        ]);
        expect(device.countCalls('SignTx')).toBe(1);
    });

    it('prepares the next transfer of an account that needs more than one', async () => {
        const amounts = Array.from({ length: 60 }, (_, index) => (200000 + index).toString());
        const { controller, reachTransfers } = setup({ amounts });
        await reachTransfers();
        const [first] = controller.getState().transfers;
        expect(first).toMatchObject({ followingTransactions: 1, plan: { inputs: { length: 50 } } });

        await controller.signTransfer(first!.key);
        await controller.broadcastTransfer(first!.key);

        const [, second] = controller.getState().transfers;
        expect(second).toMatchObject({ stage: 'ready', plan: { inputs: { length: 10 } } });
        expect(second?.plan?.amount).not.toBe(first?.plan?.amount);
    });

    describe('when the device is lost', () => {
        it('stops for good when another client takes the session', async () => {
            const { controller, device, loseDevice, reachTransfers } = setup();
            await reachTransfers();
            const callsBefore = device.calls.length;

            loseDevice('session-taken');
            await controller.signTransfer(controller.getState().transfers[0]!.key);

            expect(controller.getState().deviceLostReason).toBe('session-taken');
            expect(controller.getState().transfers[0]?.stage).toBe('ready');
            expect(device.calls).toHaveLength(callsBefore);
        });

        it('dismisses a pending PIN prompt and sends nothing more', async () => {
            const { controller, device, loseDevice } = setup({ deviceParams: { pin: '12' } });
            await controller.runPreflight();
            await controller.connectDevice();
            const discovery = controller.startDiscovery();
            await waitUntil(() => controller.getState().isPinRequested);

            loseDevice('disconnected');
            await discovery;

            expect(controller.getState()).toMatchObject({
                deviceLostReason: 'disconnected',
                isPinRequested: false,
            });
            expect(device.countCalls('PinMatrixAck')).toBe(0);
            expect(device.countCalls('Cancel')).toBe(0);
        });

        it('does not try to lock a lost device when finishing', async () => {
            const { controller, device, release, loseDevice, reachTransfers } = setup();
            await reachTransfers();
            const callsBefore = device.calls.length;

            loseDevice('disconnected');
            await controller.finish();

            expect(device.calls).toHaveLength(callsBefore);
            expect(release).not.toHaveBeenCalled();
            expect(controller.getState()).toMatchObject({ step: 'summary', isDeviceLocked: false });
        });
    });

    it('follows a transfer that was already in the mempool when the page was loaded', async () => {
        const { controller, chain, funded, reachTransfers } = setup({
            amounts: ['100000', '250000', '300000'],
        });
        // An earlier page session sent the first coin. All that is left of it is a pending
        // transaction in the history; the coin is no longer listed as unspent.
        const { descriptor } = funded.account;
        const [spent, ...unspent] = funded.utxos;
        const info = chain.accountInfos.get(descriptor)!;
        chain.utxos.set(descriptor, unspent);
        chain.accountInfos.set(descriptor, {
            ...info,
            history: {
                total: 4,
                unconfirmed: 1,
                transactions: [
                    mockHistoryTransaction({
                        blockHeight: -1,
                        details: {
                            vin: [
                                { txid: spent!.txid, n: 0, isAddress: true, isAccountOwned: true },
                            ],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    }),
                ],
            },
        });

        await reachTransfers();

        const [transfer] = controller.getState().transfers;
        expect(transfer).toMatchObject({
            inFlightTransactions: 1,
            plan: { inputs: { length: 2 } },
        });
        expect(transfer?.plan?.utxos.map(({ txid }) => txid)).not.toContain(spent!.txid);

        // Once it confirms, the account no longer has anything in flight.
        chain.accountInfos.set(descriptor, {
            ...info,
            history: { total: 4, unconfirmed: 0, transactions: [] },
        });
        await controller.refreshTransfers();

        expect(controller.getState().transfers[0]?.inFlightTransactions).toBe(0);
    });

    it('stops and reports an error nobody anticipated instead of leaving the flow hanging', async () => {
        const { controller, chain } = setup();
        await controller.runPreflight();
        await controller.connectDevice();
        chain.backend.getAccountInfo.mockRejectedValue(new Error('backend exploded'));

        await controller.startDiscovery();

        expect(controller.getState()).toMatchObject({
            unexpectedError: 'backend exploded',
            activity: undefined,
            accounts: [],
        });
    });

    it('locks the device but stays on the transfers while a signed one is unsent', async () => {
        const { controller, device, release, reachTransfers } = setup();
        await reachTransfers();
        await controller.signTransfer(controller.getState().transfers[0]!.key);

        await controller.finish();

        expect(device.calls.at(-1)).toEqual({ name: 'LockDevice', data: {} });
        expect(release).toHaveBeenCalledTimes(1);
        expect(controller.getState()).toMatchObject({
            step: 'transfers',
            isDeviceReleased: true,
            isDeviceLocked: true,
        });

        // Once it is sent, the summary opens, without talking to the released device again.
        await controller.broadcastTransfer(controller.getState().transfers[0]!.key);
        await controller.finish();

        expect(controller.getState()).toMatchObject({ step: 'summary', isDeviceLocked: true });
        expect(device.countCalls('LockDevice')).toBe(1);
        expect(release).toHaveBeenCalledTimes(1);
    });

    it('runs one action at a time', async () => {
        const { controller, device, reachTransfers } = setup();
        await reachTransfers();
        const { key } = controller.getState().transfers[0]!;

        await Promise.all([controller.signTransfer(key), controller.signTransfer(key)]);

        expect(device.countCalls('SignTx')).toBe(1);
    });
});
