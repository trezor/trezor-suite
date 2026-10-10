import { getAddress } from 'viem';

import { mock } from '@suite-common/dependency-injection';
import { PathPublic } from '@trezor/transport-common';
import { ok } from '@trezor/type-utils';

import {
    type MigrationControllerDeps,
    createMigrationController,
} from './createMigrationController';
import { mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import {
    type MockFundedEthereumAddressParams,
    mockBackend,
    mockFundedAccount,
    mockFundedEthereumAddress,
} from '../../mocks/mockBackend';
import { type MockDeviceParams, mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';
import type { BridgeConnection } from '../device/createBridgeConnection';
import type { DeviceLostReason } from '../device/deviceSession';
import { validatePassphraseEntry } from '../device/passphrase';
import type { SignedEthereumSweepRecord } from '../migration/ethereumSweepLedger';

const DESTINATION = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';

const ETHEREUM_DESTINATION = getAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');

const ONE_ETHER = '1000000000000000000';

const CHROME_ON_WINDOWS =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const BACKEND_OFFLINE = { success: false, error: { type: 'backend', message: 'offline' } } as const;

type SetupParams = {
    deviceParams?: Partial<MockDeviceParams>;
    deps?: Partial<MigrationControllerDeps>;
    /** Confirmed outputs of the Legacy account. An empty list leaves the wallet without bitcoin. */
    amounts?: string[];
    /** Ethereum addresses funded before the flow starts. None by default. */
    fundedEthereum?: Omit<MockFundedEthereumAddressParams, 'chain' | 'wallet'>[];
};

const setup = ({
    deviceParams = {},
    deps = {},
    amounts = ['100000', '250000'],
    fundedEthereum = [],
}: SetupParams = {}) => {
    const wallet = mockWallet();
    const chain = mockBackend();
    const funded = mockFundedAccount({ chain, wallet, accountType: 'p2pkh', amounts });
    const fundedAddresses = fundedEthereum.map(params =>
        mockFundedEthereumAddress({ chain, wallet, ...params }),
    );
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

    const recoverDevice = () => {
        lostReason = undefined;
    };

    // Makes the Ethereum backend show the signed transfer as a transaction it knows, the way it
    // does once the user has broadcast it.
    const showEthereumOnNetwork = (
        { txid, plan }: SignedEthereumSweepRecord,
        blockHeight: number,
    ) => {
        chain.ethereumTransactions.set(
            txid,
            mockHistoryTransaction({
                txid,
                blockHeight,
                ethereumSpecific: { status: 1, nonce: plan.nonce, gasLimit: 21000 },
            }),
        );
        chain.setEthereumAccountInfo(plan.account.chain, plan.account.address, {
            balance: '0',
            misc: { nonce: String(plan.nonce + 1) },
            history: { total: 2, unconfirmed: blockHeight > 0 ? 0 : 1, transactions: [] },
        });
    };

    const reachDiscovery = async () => {
        await controller.runPreflight();
        await controller.connectDevice();
        await controller.startDiscovery();
    };

    const reachTransfers = async () => {
        await reachDiscovery();
        controller.confirmDiscovery();
        await controller.submitDestinations({ bitcoin: DESTINATION });
    };

    const reachEthereumTransfers = async () => {
        await reachDiscovery();
        controller.confirmDiscovery();
        await controller.submitDestinations({
            ethereum: ETHEREUM_DESTINATION,
            'ethereum-classic': ETHEREUM_DESTINATION,
        });
    };

    const getBitcoinTransfers = () => controller.getState().bitcoin.transfers;
    const getEthereumTransfers = () => controller.getState().ethereum.ethereum.transfers;

    return {
        controller,
        chain,
        device,
        wallet,
        bridge,
        release,
        funded,
        fundedAddresses,
        loseDevice,
        recoverDevice,
        showEthereumOnNetwork,
        reachDiscovery,
        reachTransfers,
        reachEthereumTransfers,
        getBitcoinTransfers,
        getEthereumTransfers,
    };
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

    it('lets the user connect again after the device went away while connecting', async () => {
        const { controller, release, loseDevice, recoverDevice } = setup();
        await controller.runPreflight();

        loseDevice('disconnected');
        await controller.connectDevice();
        expect(controller.getState()).toMatchObject({
            step: 'device',
            deviceLostReason: 'disconnected',
            deviceIssue: { type: 'device-lost' },
        });
        expect(release).toHaveBeenCalledTimes(1);

        recoverDevice();
        await controller.connectDevice();

        expect(controller.getState()).toMatchObject({ step: 'discovery' });
        expect(controller.getState().deviceLostReason).toBeUndefined();
    });

    describe('discovery', () => {
        it('scans the Bitcoin accounts and then both Ethereum chains on one session', async () => {
            const { controller, device, reachDiscovery } = setup({
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });

            await reachDiscovery();

            const { bitcoin, ethereum, walletKind } = controller.getState();
            expect(walletKind).toBe('standard');
            expect(
                bitcoin.accounts.map(({ account, isEmpty }) => [account.accountType, isEmpty]),
            ).toEqual([
                ['p2pkh', false],
                ['p2pkh', true],
                ['p2sh', true],
                ['p2wpkh', true],
            ]);
            expect(ethereum.ethereum.addresses.map(({ isEmpty }) => isEmpty)).toEqual([
                false,
                true,
            ]);
            expect(
                ethereum['ethereum-classic'].addresses.map(({ account, isEmpty }) => [
                    account.slip44,
                    isEmpty,
                ]),
            ).toEqual([
                [61, true],
                [60, true],
            ]);

            // The device answers for Bitcoin first, then for the Ethereum chains.
            const names = device.calls.map(({ name }) => name);
            expect(names.lastIndexOf('GetPublicKey')).toBeLessThan(
                names.indexOf('EthereumGetAddress'),
            );
            expect(device.countCalls('EthereumGetAddress')).toBe(4);
        });

        it('scans bitcoin only on firmware without Ethereum replay protection', async () => {
            const { controller, device, reachDiscovery } = setup({
                deviceParams: { features: { minor_version: 4, patch_version: 1 } },
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });

            await reachDiscovery();

            expect(device.countCalls('EthereumGetAddress')).toBe(0);
            expect(controller.getState()).toMatchObject({
                walletKind: 'standard',
                ethereum: {
                    ethereum: { addresses: [] },
                    'ethereum-classic': { addresses: [] },
                },
            });
            expect(controller.getState().bitcoin.accounts.length).toBeGreaterThan(0);
        });

        it('keeps the other coins when one blockbook fails', async () => {
            const { controller, chain, reachDiscovery } = setup({
                fundedEthereum: [
                    { ethereumChain: 'ethereum-classic', slip44: 61, balance: ONE_ETHER },
                ],
            });
            chain.backend.ethereum.ethereum.getAccountInfo.mockResolvedValue(BACKEND_OFFLINE);

            await reachDiscovery();

            const state = controller.getState();
            expect(state.discoveryError).toBeUndefined();
            expect(state.walletKind).toBe('standard');
            expect(state.ethereum.ethereum).toMatchObject({
                addresses: [],
                discoveryError: BACKEND_OFFLINE.error,
            });
            expect(state.bitcoin.accounts.length).toBeGreaterThan(0);
            expect(state.ethereum['ethereum-classic'].addresses.length).toBe(3);

            // The coins that were found can still be moved.
            controller.confirmDiscovery();
            await controller.submitDestinations({
                bitcoin: DESTINATION,
                'ethereum-classic': ETHEREUM_DESTINATION,
            });

            expect(controller.getState().step).toBe('transfers');
            expect(controller.getState().bitcoin.transfers).toHaveLength(1);
            expect(controller.getState().ethereum['ethereum-classic'].transfers).toHaveLength(1);
            expect(controller.getState().ethereum.ethereum.transfers).toEqual([]);
        });

        it('does not fall back to the raw passphrase while a blockbook failure leaves a coin unknown', async () => {
            const typed = 'příliš';
            const candidates = validatePassphraseEntry({ first: typed, second: typed });
            if (!candidates.success) throw new Error('test passphrase must be valid');

            const normalizedWallet = mockWallet('aa'.repeat(16));
            const rawWallet = mockWallet('bb'.repeat(16));
            const { controller, chain, device } = setup({
                deviceParams: {
                    hasPassphraseProtection: true,
                    wallets: {
                        [candidates.payload.normalized]: normalizedWallet,
                        [typed]: rawWallet,
                    },
                },
                amounts: [],
            });
            // Only the raw wallet has coins the page could see, but the Ethereum blockbook is
            // down, so the normalized wallet is not known to be empty.
            mockFundedEthereumAddress({
                chain,
                wallet: rawWallet,
                ethereumChain: 'ethereum',
                balance: ONE_ETHER,
            });
            chain.backend.ethereum.ethereum.getAccountInfo.mockResolvedValue(BACKEND_OFFLINE);

            await controller.runPreflight();
            await controller.connectDevice();
            await controller.submitPassphrase(typed, typed);

            expect(controller.getState()).toMatchObject({
                step: 'discovery',
                walletKind: 'passphrase-normalized',
                ethereum: { ethereum: { addresses: [], discoveryError: BACKEND_OFFLINE.error } },
            });
            expect(
                device.calls.filter(({ name }) => name === 'PassphraseAck').map(({ data }) => data),
            ).toEqual([{ passphrase: candidates.payload.normalized }]);
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
            expect(controller.getState().bitcoin.accounts.length).toBeGreaterThan(0);
            expect(device.countCalls('PinMatrixAck')).toBe(1);
        });

        it('stops the whole discovery at a wrong PIN and sends it again only when asked', async () => {
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
            expect(controller.getState().walletKind).toBeUndefined();
            expect(device.countCalls('PinMatrixAck')).toBe(1);
            expect(device.countCalls('EthereumGetAddress')).toBe(0);
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

        it('does not continue while nothing was found to move', async () => {
            const { controller, reachDiscovery } = setup({ amounts: [] });
            await reachDiscovery();

            controller.confirmDiscovery();

            expect(controller.getState().step).toBe('discovery');
        });
    });

    it('moves the funds from discovery to a confirmed transfer and locks the device', async () => {
        const { controller, chain, device, release, reachTransfers } = setup();

        await reachTransfers();
        const [transfer] = controller.getState().bitcoin.transfers;
        expect(controller.getState().step).toBe('transfers');
        expect(transfer).toMatchObject({ stage: 'ready', plan: { inputs: { length: 2 } } });

        await controller.signTransfer(transfer!.key);
        const signed = controller.getState().bitcoin.transfers[0]!;
        expect(signed).toMatchObject({ stage: 'signed', record: { hex: expect.any(String) } });

        // The user broadcast the hex elsewhere and the backend shows it mined: the inputs are
        // spent by a confirmed transaction that pays the destination the composed amount.
        chain.seeTransaction(signed.record!.hex, { blockHeight: 800010 });
        await controller.refreshTransfers();
        expect(controller.getState().bitcoin.transfers[0]).toMatchObject({
            stage: 'on-network',
            status: 'confirmed',
        });

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

    describe('destinations', () => {
        it.each([
            ['an address of the scanned wallet', undefined, { type: 'own-address' }],
            [
                'a Taproot address',
                'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                { type: 'unsupported-format', format: 'bech32m' },
            ],
            ['something that is not an address', 'hello', { type: 'invalid' }],
        ])('refuses %s without composing anything', async (_description, address, error) => {
            const { controller, device, funded, reachDiscovery } = setup();
            await reachDiscovery();
            controller.confirmDiscovery();
            const callsBefore = device.calls.length;

            await controller.submitDestinations({ bitcoin: address ?? funded.utxos[0]!.address });

            expect(controller.getState()).toMatchObject({
                step: 'destination',
                bitcoin: { destinationError: error, transfers: [] },
            });
            expect(device.calls).toHaveLength(callsBefore);
        });

        it('refuses a bech32 address on firmware that cannot pay to it', async () => {
            const { controller, reachDiscovery } = setup({
                deviceParams: { features: { minor_version: 5, patch_version: 2 } },
            });
            await reachDiscovery();
            controller.confirmDiscovery();

            await controller.submitDestinations({
                bitcoin: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
            });

            expect(controller.getState().bitcoin.destinationError).toEqual({
                type: 'unsupported-format',
                format: 'bech32',
            });
        });

        it('shows the mistakes of every coin at once and prepares nothing until all are accepted', async () => {
            const { controller, chain, device, fundedAddresses, reachDiscovery } = setup({
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });
            await reachDiscovery();
            controller.confirmDiscovery();
            const callsBefore = device.calls.length;
            const utxoRequestsBefore = chain.backend.getAccountUtxo.mock.calls.length;

            await controller.submitDestinations({
                bitcoin: 'hello',
                ethereum: fundedAddresses[0]!.address.toLowerCase(),
            });
            expect(controller.getState()).toMatchObject({
                step: 'destination',
                bitcoin: { destinationError: { type: 'invalid' } },
                ethereum: { ethereum: { destinationError: { type: 'own-address' } } },
            });

            // One accepted address does not get its coin prepared while another is refused.
            await controller.submitDestinations({
                bitcoin: DESTINATION,
                ethereum: ETHEREUM_DESTINATION.replace('C5', 'c5'),
            });
            expect(controller.getState()).toMatchObject({
                step: 'destination',
                bitcoin: { destinationError: undefined, transfers: [] },
                ethereum: { ethereum: { destinationError: { type: 'bad-checksum' } } },
            });
            expect(controller.getState().bitcoin.destination).toBeUndefined();
            expect(chain.backend.getAccountUtxo.mock.calls).toHaveLength(utxoRequestsBefore);
            expect(chain.backend.ethereum.ethereum.estimateGasPrice).not.toHaveBeenCalled();
            expect(device.calls).toHaveLength(callsBefore);

            await controller.submitDestinations({
                bitcoin: DESTINATION,
                ethereum: ETHEREUM_DESTINATION,
            });

            expect(controller.getState().step).toBe('transfers');
            expect(controller.getState().bitcoin.transfers).toHaveLength(1);
            expect(controller.getState().ethereum.ethereum.transfers).toHaveLength(1);
        });

        it('lets the addresses be changed only while nothing of any coin is signed', async () => {
            const { controller, reachDiscovery, getEthereumTransfers } = setup({
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });
            await reachDiscovery();
            controller.confirmDiscovery();
            await controller.submitDestinations({
                bitcoin: DESTINATION,
                ethereum: ETHEREUM_DESTINATION,
            });

            controller.editDestinations();
            expect(controller.getState()).toMatchObject({
                step: 'destination',
                bitcoin: { destination: undefined, transfers: [] },
                ethereum: { ethereum: { destination: undefined, transfers: [] } },
            });

            await controller.submitDestinations({
                bitcoin: DESTINATION,
                ethereum: ETHEREUM_DESTINATION,
            });
            await controller.signTransfer(getEthereumTransfers()[0]!.key);
            controller.editDestinations();

            expect(controller.getState().step).toBe('transfers');
        });
    });

    it('replaces a transfer rejected on the device with one that has a new amount', async () => {
        const { controller, device, reachTransfers } = setup({
            deviceParams: { isOutputRejected: true },
        });
        await reachTransfers();
        const [first] = controller.getState().bitcoin.transfers;

        await controller.signTransfer(first!.key);

        const [second] = controller.getState().bitcoin.transfers;
        expect(second).toMatchObject({
            stage: 'ready',
            error: { type: 'failure', code: 'Failure_ActionCancelled' },
        });
        expect(second?.key).not.toBe(first?.key);
        expect(second?.plan?.amount).not.toBe(first?.plan?.amount);
        expect(device.countCalls('SignTx')).toBe(1);
    });

    it('shows the hex after signing and reports the transaction once it appears on the network', async () => {
        const { controller, chain, device, reachTransfers, getBitcoinTransfers } = setup();
        await reachTransfers();
        await controller.signTransfer(getBitcoinTransfers()[0]!.key);
        const signed = getBitcoinTransfers()[0]!;
        expect(signed).toMatchObject({
            stage: 'signed',
            record: { hex: expect.any(String), txid: expect.stringMatching(/^[0-9a-f]{64}$/) },
        });

        // Nothing was broadcast yet: the network does not show the transaction and the page
        // keeps the hex on display.
        await controller.refreshTransfers();
        expect(getBitcoinTransfers()[0]).toMatchObject({ stage: 'signed' });
        expect(getBitcoinTransfers()[0]?.status).toBeUndefined();

        // The user broadcast the hex elsewhere.
        chain.seeTransaction(signed.record!.hex);
        await controller.refreshTransfers();
        expect(getBitcoinTransfers()[0]).toMatchObject({ stage: 'on-network', status: 'pending' });

        chain.seeTransaction(signed.record!.hex, { blockHeight: 800010 });
        await controller.refreshTransfers();
        expect(getBitcoinTransfers()[0]).toMatchObject({
            stage: 'on-network',
            status: 'confirmed',
        });
        expect(device.countCalls('SignTx')).toBe(1);
    });

    it('does not report its own pending transfer as one from elsewhere', async () => {
        const { controller, chain, reachTransfers, getBitcoinTransfers } = setup();
        await reachTransfers();
        await controller.signTransfer(getBitcoinTransfers()[0]!.key);

        chain.seeTransaction(getBitcoinTransfers()[0]!.record!.hex);
        await controller.refreshTransfers();

        expect(getBitcoinTransfers()[0]).toMatchObject({
            stage: 'on-network',
            status: 'pending',
            inFlightTransactions: 0,
        });
    });

    it('prepares the next transfer of an account once the first one is seen on the network', async () => {
        const amounts = Array.from({ length: 60 }, (_, index) => (200000 + index).toString());
        const { controller, chain, reachTransfers, getBitcoinTransfers } = setup({ amounts });
        await reachTransfers();
        const [first] = getBitcoinTransfers();
        expect(first).toMatchObject({ followingTransactions: 1, plan: { inputs: { length: 50 } } });

        // While the signed transaction waits for the user's broadcast, nothing more is composed.
        await controller.signTransfer(first!.key);
        await controller.refreshTransfers();
        expect(getBitcoinTransfers()).toHaveLength(1);

        const { hex } = getBitcoinTransfers()[0]!.record!;
        chain.seeTransaction(hex);
        await controller.refreshTransfers();

        const [, second] = getBitcoinTransfers();
        expect(second).toMatchObject({ stage: 'ready', plan: { inputs: { length: 10 } } });
        expect(second?.plan?.amount).not.toBe(first?.plan?.amount);

        // Seeing the first one again, confirmed this time, composes nothing more.
        chain.seeTransaction(hex, { blockHeight: 800010 });
        await controller.refreshTransfers();
        expect(getBitcoinTransfers()).toHaveLength(2);
        expect(getBitcoinTransfers()[0]?.status).toBe('confirmed');
    });

    describe('when the device is lost', () => {
        it('stops for good when another client takes the session', async () => {
            const { controller, device, loseDevice, reachTransfers } = setup();
            await reachTransfers();
            const callsBefore = device.calls.length;

            loseDevice('session-taken');
            await controller.signTransfer(controller.getState().bitcoin.transfers[0]!.key);

            expect(controller.getState().deviceLostReason).toBe('session-taken');
            expect(controller.getState().bitcoin.transfers[0]?.stage).toBe('ready');
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

        const [transfer] = controller.getState().bitcoin.transfers;
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

        expect(controller.getState().bitcoin.transfers[0]?.inFlightTransactions).toBe(0);
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
            bitcoin: { accounts: [] },
        });
    });

    it('locks the device but stays on the transfers while a signed one is not on the network yet', async () => {
        const { controller, chain, device, release, reachTransfers, getBitcoinTransfers } = setup();
        await reachTransfers();
        await controller.signTransfer(getBitcoinTransfers()[0]!.key);

        await controller.finish();

        expect(device.calls.at(-1)).toEqual({ name: 'LockDevice', data: {} });
        expect(release).toHaveBeenCalledTimes(1);
        expect(controller.getState()).toMatchObject({
            step: 'transfers',
            isDeviceReleased: true,
            isDeviceLocked: true,
        });

        // Once the network shows it, the summary opens, without talking to the released device
        // again.
        chain.seeTransaction(getBitcoinTransfers()[0]!.record!.hex);
        await controller.refreshTransfers();
        await controller.finish();

        expect(controller.getState()).toMatchObject({ step: 'summary', isDeviceLocked: true });
        expect(device.countCalls('LockDevice')).toBe(1);
        expect(release).toHaveBeenCalledTimes(1);
    });

    it('runs one action at a time', async () => {
        const { controller, device, reachTransfers } = setup();
        await reachTransfers();
        const { key } = controller.getState().bitcoin.transfers[0]!;

        await Promise.all([controller.signTransfer(key), controller.signTransfer(key)]);

        expect(device.countCalls('SignTx')).toBe(1);
    });

    describe('Ethereum', () => {
        it('moves bitcoin and ether in one run through to confirmed transfers and a locked device', async () => {
            const {
                controller,
                chain,
                device,
                release,
                fundedAddresses,
                showEthereumOnNetwork,
                reachDiscovery,
                getBitcoinTransfers,
                getEthereumTransfers,
            } = setup({ fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }] });

            await reachDiscovery();
            controller.confirmDiscovery();
            expect(controller.getState().step).toBe('destination');

            await controller.submitDestinations({
                bitcoin: DESTINATION,
                ethereum: ETHEREUM_DESTINATION,
            });
            expect(controller.getState().step).toBe('transfers');
            expect(controller.getState().ethereum['ethereum-classic']).toMatchObject({
                destination: undefined,
                transfers: [],
            });
            const [bitcoinTransfer] = getBitcoinTransfers();
            const [ethereumTransfer] = getEthereumTransfers();
            expect(bitcoinTransfer).toMatchObject({
                stage: 'ready',
                plan: { inputs: { length: 2 } },
            });
            expect(ethereumTransfer).toMatchObject({
                stage: 'ready',
                isInFlight: false,
                account: fundedAddresses[0]!.account,
                plan: {
                    nonce: 0,
                    gasPrice: '24000000000',
                    fee: '504000000000000',
                    amount: '999496000000000000',
                    destination: { address: ETHEREUM_DESTINATION },
                },
            });
            expect(bitcoinTransfer?.key).not.toBe(ethereumTransfer?.key);

            await controller.signTransfer(bitcoinTransfer!.key);
            await controller.signTransfer(ethereumTransfer!.key);
            expect(device.countCalls('SignTx')).toBe(1);
            expect(device.countCalls('EthereumSignTx')).toBe(1);
            const signedBitcoin = getBitcoinTransfers()[0]!;
            const signedEthereum = getEthereumTransfers()[0]!;
            expect(signedBitcoin.stage).toBe('signed');
            expect(signedEthereum).toMatchObject({
                stage: 'signed',
                record: { hex: expect.stringMatching(/^0x/) },
            });

            // The user broadcast both elsewhere; the backends show them mined.
            chain.seeTransaction(signedBitcoin.record!.hex, { blockHeight: 800010 });
            showEthereumOnNetwork(signedEthereum.record!, 20_000_000);
            await controller.refreshTransfers();
            expect(getBitcoinTransfers()[0]).toMatchObject({
                stage: 'on-network',
                status: 'confirmed',
            });
            expect(getEthereumTransfers()[0]).toMatchObject({
                stage: 'on-network',
                status: 'confirmed',
            });

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

        it('moves ether from a wallet without bitcoin', async () => {
            const {
                controller,
                reachEthereumTransfers,
                getBitcoinTransfers,
                getEthereumTransfers,
            } = setup({
                amounts: [],
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });

            await reachEthereumTransfers();

            expect(controller.getState()).toMatchObject({
                step: 'transfers',
                bitcoin: { destination: undefined },
            });
            expect(getBitcoinTransfers()).toEqual([]);
            expect(getEthereumTransfers()).toHaveLength(1);
        });

        it('finds Ethereum Classic on both path families and prepares one transfer per address', async () => {
            const { controller, reachEthereumTransfers } = setup({
                amounts: [],
                fundedEthereum: [
                    { ethereumChain: 'ethereum-classic', slip44: 61, balance: ONE_ETHER },
                    { ethereumChain: 'ethereum-classic', slip44: 60, index: 0, balance: ONE_ETHER },
                    { ethereumChain: 'ethereum-classic', slip44: 60, index: 1, balance: '1' },
                ],
            });

            await reachEthereumTransfers();

            const classic = controller.getState().ethereum['ethereum-classic'];
            expect(
                classic.addresses.map(({ account, isEmpty }) => [
                    account.slip44,
                    account.index,
                    isEmpty,
                ]),
            ).toEqual([
                [61, 0, false],
                [61, 1, true],
                [60, 0, false],
                [60, 1, false],
                [60, 2, true],
            ]);
            expect(
                classic.transfers.map(({ account, plan, leftover }) => [
                    account.slip44,
                    account.index,
                    plan?.chainId,
                    leftover?.reason,
                ]),
            ).toEqual([
                [61, 0, 61, undefined],
                [60, 0, 61, undefined],
                [60, 1, undefined, 'insufficient-for-fee'],
            ]);
            expect(controller.getState().ethereum.ethereum.transfers).toEqual([]);
        });

        it('replaces a transfer rejected on the device with one composed afresh', async () => {
            const { controller, chain, device, getEthereumTransfers, reachEthereumTransfers } =
                setup({
                    deviceParams: { isOutputRejected: true },
                    amounts: [],
                    fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
                });
            await reachEthereumTransfers();
            const [first] = getEthereumTransfers();

            // The gas price moved while the first attempt was on the device.
            chain.gasPrices.ethereum = '30000000000';
            await controller.signTransfer(first!.key);

            const [second] = getEthereumTransfers();
            expect(second).toMatchObject({
                stage: 'ready',
                error: { type: 'failure', code: 'Failure_ActionCancelled' },
                plan: { gasPrice: '36000000000' },
            });
            expect(second?.key).not.toBe(first?.key);
            expect(second?.plan?.amount).not.toBe(first?.plan?.amount);
            expect(device.countCalls('EthereumSignTx')).toBe(1);
        });

        it('shows the hex after signing and reports the transaction once it appears on the network', async () => {
            const {
                controller,
                chain,
                device,
                fundedAddresses,
                showEthereumOnNetwork,
                getEthereumTransfers,
                reachEthereumTransfers,
            } = setup({
                amounts: [],
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });
            await reachEthereumTransfers();
            await controller.signTransfer(getEthereumTransfers()[0]!.key);
            const signed = getEthereumTransfers()[0]!;
            expect(signed).toMatchObject({
                stage: 'signed',
                record: {
                    hex: expect.stringMatching(/^0x/),
                    txid: expect.stringMatching(/^0x[0-9a-f]{64}$/),
                },
            });

            // The backend does not know the transaction and the nonce is unused: the page waits.
            await controller.refreshTransfers();
            expect(getEthereumTransfers()[0]).toMatchObject({ stage: 'signed' });
            expect(getEthereumTransfers()[0]?.status).toBeUndefined();

            // The nonce moved on without the transaction showing up: still not proof of anything.
            chain.setEthereumAccountInfo('ethereum', fundedAddresses[0]!.address, {
                misc: { nonce: '1' },
            });
            await controller.refreshTransfers();
            expect(getEthereumTransfers()[0]).toMatchObject({ stage: 'signed' });

            // The user broadcast the hex elsewhere.
            showEthereumOnNetwork(signed.record!, -1);
            await controller.refreshTransfers();
            expect(getEthereumTransfers()[0]).toMatchObject({
                stage: 'on-network',
                status: 'pending',
            });

            showEthereumOnNetwork(signed.record!, 20_000_000);
            await controller.refreshTransfers();
            expect(getEthereumTransfers()[0]).toMatchObject({
                stage: 'on-network',
                status: 'confirmed',
            });
            expect(device.countCalls('EthereumSignTx')).toBe(1);
        });

        it('waits for a transaction in flight before composing', async () => {
            const {
                controller,
                chain,
                fundedAddresses,
                getEthereumTransfers,
                reachEthereumTransfers,
            } = setup({
                amounts: [],
                fundedEthereum: [
                    { ethereumChain: 'ethereum', balance: ONE_ETHER, unconfirmedTransactions: 1 },
                ],
            });
            await reachEthereumTransfers();

            expect(getEthereumTransfers()[0]).toMatchObject({ isInFlight: true, stage: 'ready' });
            expect(getEthereumTransfers()[0]?.plan).toBeUndefined();

            chain.setEthereumAccountInfo('ethereum', fundedAddresses[0]!.address, {
                history: { total: 2, unconfirmed: 0, transactions: [] },
                misc: { nonce: '1' },
            });
            await controller.refreshTransfers();

            expect(getEthereumTransfers()[0]).toMatchObject({
                isInFlight: false,
                plan: { nonce: 1 },
            });
        });

        it('refuses to compose above the gas price cap until it is retried at a lower one', async () => {
            const { controller, chain, getEthereumTransfers, reachEthereumTransfers } = setup({
                amounts: [],
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });
            chain.gasPrices.ethereum = '500000000000';
            await reachEthereumTransfers();

            expect(getEthereumTransfers()[0]).toMatchObject({
                stage: 'ready',
                error: { type: 'gas-price-too-high', gasPrice: '600000000000' },
            });

            chain.gasPrices.ethereum = '20000000000';
            await controller.retryTransfer(getEthereumTransfers()[0]!.key);

            expect(getEthereumTransfers()[0]).toMatchObject({ plan: { gasPrice: '24000000000' } });
            expect(getEthereumTransfers()[0]?.error).toBeUndefined();
        });

        it('stays on the transfers while a signed transaction is not on the network yet, then shows the summary', async () => {
            const {
                controller,
                device,
                showEthereumOnNetwork,
                getEthereumTransfers,
                reachEthereumTransfers,
            } = setup({
                amounts: [],
                fundedEthereum: [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
            });
            await reachEthereumTransfers();
            await controller.signTransfer(getEthereumTransfers()[0]!.key);

            await controller.finish();
            expect(controller.getState()).toMatchObject({
                step: 'transfers',
                isDeviceLocked: true,
            });

            showEthereumOnNetwork(getEthereumTransfers()[0]!.record!, -1);
            await controller.refreshTransfers();
            await controller.finish();

            expect(controller.getState()).toMatchObject({ step: 'summary' });
            expect(device.countCalls('LockDevice')).toBe(1);
        });
    });
});
