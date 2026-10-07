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
import type { EthereumChain } from '../ethereum/ethereumChain';
import type { SignedEthereumSweepRecord } from '../migration/ethereumSweepLedger';

const DESTINATION = getAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');

const ONE_ETHER = '1000000000000000000';

const CHROME_ON_WINDOWS =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

type SetupParams = {
    deviceParams?: Partial<MockDeviceParams>;
    deps?: Partial<MigrationControllerDeps>;
    /** Addresses funded before the flow starts. Defaults to one Ethereum address with 1 ETH. */
    funded?: Omit<MockFundedEthereumAddressParams, 'chain' | 'wallet'>[];
};

const setup = ({
    deviceParams = {},
    deps = {},
    funded = [{ ethereumChain: 'ethereum', balance: ONE_ETHER }],
}: SetupParams = {}) => {
    const wallet = mockWallet();
    const chain = mockBackend();
    const fundedAddresses = funded.map(params =>
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

    // Makes the backend show the signed transfer as a transaction it knows.
    const showOnNetwork = ({ txid, plan }: SignedEthereumSweepRecord, blockHeight: number) => {
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

    const reachDiscovery = async (coin: EthereumChain = 'ethereum') => {
        await controller.runPreflight();
        await controller.connectDevice();
        controller.chooseCoin(coin);
        await controller.ethereum.startDiscovery();
    };

    const reachTransfers = async (coin: EthereumChain = 'ethereum') => {
        await reachDiscovery(coin);
        controller.ethereum.confirmDiscovery();
        await controller.ethereum.submitDestination(DESTINATION);
    };

    const getTransfers = () => controller.getState().ethereum.transfers;

    return {
        controller,
        chain,
        device,
        wallet,
        bridge,
        release,
        fundedAddresses,
        loseDevice,
        showOnNetwork,
        reachDiscovery,
        reachTransfers,
        getTransfers,
    };
};

describe('Ethereum migration flow', () => {
    it('offers the coin choice right after the device is accepted', async () => {
        const { controller } = setup();
        await controller.runPreflight();
        await controller.connectDevice();

        expect(controller.getState().step).toBe('discovery');
        expect(controller.getState().coin).toBeUndefined();

        controller.chooseCoin('ethereum');

        expect(controller.getState()).toMatchObject({
            step: 'ethereum-discovery',
            coin: 'ethereum',
        });
    });

    it('does not offer Ethereum on firmware without replay protection', async () => {
        const { controller, device } = setup({
            deviceParams: { features: { minor_version: 4, patch_version: 1 } },
        });
        await controller.runPreflight();
        await controller.connectDevice();

        controller.chooseCoin('ethereum');
        expect(controller.getState().coin).toBeUndefined();

        controller.chooseCoin('bitcoin');
        expect(controller.getState()).toMatchObject({ step: 'discovery', coin: 'bitcoin' });
        expect(device.countCalls('EthereumGetAddress')).toBe(0);
    });

    it('moves the ETH from discovery to a confirmed transfer and locks the device', async () => {
        const {
            controller,
            chain,
            device,
            release,
            fundedAddresses,
            showOnNetwork,
            reachTransfers,
            getTransfers,
        } = setup();

        await reachTransfers();
        expect(controller.getState()).toMatchObject({
            step: 'ethereum-transfers',
            walletKind: 'standard',
        });
        expect(controller.getState().ethereum.addresses.map(({ isEmpty }) => isEmpty)).toEqual([
            false,
            true,
        ]);

        const [transfer] = getTransfers();
        expect(transfer).toMatchObject({
            stage: 'ready',
            isInFlight: false,
            account: fundedAddresses[0]!.account,
            plan: {
                nonce: 0,
                gasPrice: '24000000000',
                fee: '504000000000000',
                amount: '999496000000000000',
                destination: { address: DESTINATION },
            },
        });

        await controller.ethereum.signTransfer(transfer!.key);
        const signed = getTransfers()[0]!;
        expect(signed).toMatchObject({
            stage: 'signed',
            record: { hex: expect.stringMatching(/^0x/) },
        });
        expect(device.countCalls('EthereumSignTx')).toBe(1);

        await controller.ethereum.broadcastTransfer(signed.key);
        expect(chain.pushedEthereumTransactions).toEqual([signed.record?.hex]);
        expect(getTransfers()[0]).toMatchObject({ stage: 'broadcast', status: 'pending' });

        showOnNetwork(signed.record!, 20_000_000);
        await controller.refreshTransfers();
        expect(getTransfers()[0]?.status).toBe('confirmed');

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

    it('chooses the coin before the passphrase and keeps the passphrase out of the state', async () => {
        const hidden = mockWallet('aa'.repeat(16));
        const { controller, chain, device } = setup({
            deviceParams: { hasPassphraseProtection: true, wallets: { 'my secret': hidden } },
            funded: [],
        });
        mockFundedEthereumAddress({
            chain,
            wallet: hidden,
            ethereumChain: 'ethereum',
            balance: ONE_ETHER,
        });

        await controller.runPreflight();
        await controller.connectDevice();
        expect(controller.getState().step).toBe('passphrase');
        expect(controller.getState().coin).toBeUndefined();

        controller.chooseCoin('ethereum');
        expect(controller.getState()).toMatchObject({ step: 'passphrase', coin: 'ethereum' });

        await controller.submitPassphrase('my secret', 'my secret');

        expect(controller.getState()).toMatchObject({
            step: 'ethereum-discovery',
            walletKind: 'passphrase-normalized',
        });
        expect(controller.getState().ethereum.addresses.map(({ isEmpty }) => isEmpty)).toEqual([
            false,
            true,
        ]);
        expect(JSON.stringify(controller.getState())).not.toContain('my secret');
        expect(device.countCalls('PassphraseAck')).toBe(1);
    });

    it('finds Ethereum Classic on both path families and prepares one transfer per address', async () => {
        const { controller, getTransfers, reachTransfers } = setup({
            funded: [
                { ethereumChain: 'ethereum-classic', slip44: 61, balance: ONE_ETHER },
                { ethereumChain: 'ethereum-classic', slip44: 60, index: 0, balance: ONE_ETHER },
                { ethereumChain: 'ethereum-classic', slip44: 60, index: 1, balance: '1' },
            ],
        });

        await reachTransfers('ethereum-classic');

        expect(
            controller
                .getState()
                .ethereum.addresses.map(({ account, isEmpty }) => [
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
            getTransfers().map(({ account, plan, leftover }) => [
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
    });

    it('replaces a transfer rejected on the device with one composed afresh', async () => {
        const { controller, chain, device, getTransfers, reachTransfers } = setup({
            deviceParams: { isOutputRejected: true },
        });
        await reachTransfers();
        const [first] = getTransfers();

        // The gas price moved while the first attempt was on the device.
        chain.gasPrices.ethereum = '30000000000';
        await controller.ethereum.signTransfer(first!.key);

        const [second] = getTransfers();
        expect(second).toMatchObject({
            stage: 'ready',
            error: { type: 'failure', code: 'Failure_ActionCancelled' },
            plan: { gasPrice: '36000000000' },
        });
        expect(second?.key).not.toBe(first?.key);
        expect(second?.plan?.amount).not.toBe(first?.plan?.amount);
        expect(device.countCalls('EthereumSignTx')).toBe(1);
        expect(device.calls.map(({ name }) => name).slice(-2)).toEqual(['ButtonAck', 'Initialize']);
    });

    it('keeps a signed transfer for another broadcast when the first one fails', async () => {
        const { controller, chain, device, getTransfers, reachTransfers } = setup();
        await reachTransfers();
        await controller.ethereum.signTransfer(getTransfers()[0]!.key);
        const signed = getTransfers()[0]!;

        chain.backend.ethereum.ethereum.pushTransaction.mockResolvedValueOnce({
            success: false,
            error: { type: 'backend', message: 'rejected' },
        });
        await controller.ethereum.broadcastTransfer(signed.key);
        expect(getTransfers()[0]).toMatchObject({
            stage: 'signed',
            error: { type: 'broadcast-failed', message: 'rejected' },
        });

        await controller.ethereum.broadcastTransfer(signed.key);

        expect(getTransfers()[0]).toMatchObject({ stage: 'broadcast', status: 'pending' });
        expect(chain.backend.ethereum.ethereum.pushTransaction.mock.calls).toEqual([
            [signed.record?.hex],
            [signed.record?.hex],
        ]);
        expect(device.countCalls('EthereumSignTx')).toBe(1);
    });

    it('counts a failed broadcast as sent when the network already has the transaction', async () => {
        const { controller, chain, getTransfers, showOnNetwork, reachTransfers } = setup();
        await reachTransfers();
        await controller.ethereum.signTransfer(getTransfers()[0]!.key);
        const signed = getTransfers()[0]!;

        showOnNetwork(signed.record!, -1);
        chain.backend.ethereum.ethereum.pushTransaction.mockResolvedValueOnce({
            success: false,
            error: { type: 'backend', message: 'already known' },
        });
        await controller.ethereum.broadcastTransfer(signed.key);

        expect(getTransfers()[0]).toMatchObject({ stage: 'broadcast', status: 'pending' });
        expect(getTransfers()[0]?.error).toBeUndefined();
    });

    it('re-sends the stored bytes when the transaction fell out of the mempool', async () => {
        const { controller, chain, device, getTransfers, reachTransfers } = setup();
        await reachTransfers();
        await controller.ethereum.signTransfer(getTransfers()[0]!.key);
        const signed = getTransfers()[0]!;
        await controller.ethereum.broadcastTransfer(signed.key);

        // The backend never saw it: the nonce is still unused and nothing is pending.
        await controller.refreshTransfers();
        expect(getTransfers()[0]?.status).toBe('not-in-mempool');

        await controller.ethereum.broadcastTransfer(signed.key);

        expect(chain.pushedEthereumTransactions).toEqual([signed.record?.hex, signed.record?.hex]);
        expect(device.countCalls('EthereumSignTx')).toBe(1);
    });

    it('refuses a destination of the scanned wallet and a mistyped checksum', async () => {
        const { controller, device, fundedAddresses, getTransfers, reachDiscovery } = setup();
        await reachDiscovery();
        controller.ethereum.confirmDiscovery();
        const callsBefore = device.calls.length;

        await controller.ethereum.submitDestination(fundedAddresses[0]!.address.toLowerCase());
        expect(controller.getState()).toMatchObject({
            step: 'ethereum-destination',
            ethereum: { destinationError: { type: 'own-address' } },
        });

        await controller.ethereum.submitDestination(DESTINATION.replace('C5', 'c5'));
        expect(controller.getState().ethereum.destinationError).toEqual({ type: 'bad-checksum' });

        expect(getTransfers()).toEqual([]);
        expect(device.calls).toHaveLength(callsBefore);
    });

    it('waits for a transaction in flight before composing', async () => {
        const { controller, chain, fundedAddresses, getTransfers, reachTransfers } = setup({
            funded: [{ ethereumChain: 'ethereum', balance: ONE_ETHER, unconfirmedTransactions: 1 }],
        });
        await reachTransfers();

        expect(getTransfers()[0]).toMatchObject({ isInFlight: true, stage: 'ready' });
        expect(getTransfers()[0]?.plan).toBeUndefined();

        chain.setEthereumAccountInfo('ethereum', fundedAddresses[0]!.address, {
            history: { total: 2, unconfirmed: 0, transactions: [] },
            misc: { nonce: '1' },
        });
        await controller.refreshTransfers();

        expect(getTransfers()[0]).toMatchObject({ isInFlight: false, plan: { nonce: 1 } });
    });

    it('refuses to compose above the gas price cap until it is retried at a lower one', async () => {
        const { controller, chain, getTransfers, reachTransfers } = setup();
        chain.gasPrices.ethereum = '500000000000';
        await reachTransfers();

        expect(getTransfers()[0]).toMatchObject({
            stage: 'ready',
            error: { type: 'gas-price-too-high', gasPrice: '600000000000' },
        });

        chain.gasPrices.ethereum = '20000000000';
        await controller.ethereum.retryTransfer(getTransfers()[0]!.key);

        expect(getTransfers()[0]).toMatchObject({ plan: { gasPrice: '24000000000' } });
        expect(getTransfers()[0]?.error).toBeUndefined();
    });

    it('returns to the coin choice and lets Bitcoin be chosen instead', async () => {
        const { controller, chain, wallet, reachDiscovery } = setup();
        mockFundedAccount({ chain, wallet, accountType: 'p2pkh', amounts: ['100000'] });
        await reachDiscovery();
        expect(controller.getState().ethereum.addresses).toHaveLength(2);

        controller.changeCoin();
        expect(controller.getState().step).toBe('discovery');
        expect(controller.getState().coin).toBeUndefined();
        expect(controller.getState().ethereum.addresses).toEqual([]);

        controller.chooseCoin('bitcoin');
        await controller.startDiscovery();

        expect(controller.getState()).toMatchObject({ step: 'discovery', coin: 'bitcoin' });
        expect(controller.getState().accounts.length).toBeGreaterThan(0);
    });

    it('does not return to the coin choice once a transfer is prepared', async () => {
        const { controller, reachTransfers } = setup();
        await reachTransfers();

        controller.changeCoin();

        expect(controller.getState()).toMatchObject({
            step: 'ethereum-transfers',
            coin: 'ethereum',
        });
    });

    it('stops for good when the device is lost before signing', async () => {
        const { controller, device, loseDevice, getTransfers, reachTransfers } = setup();
        await reachTransfers();
        const callsBefore = device.calls.length;

        loseDevice('session-taken');
        await controller.ethereum.signTransfer(getTransfers()[0]!.key);

        expect(controller.getState().deviceLostReason).toBe('session-taken');
        expect(getTransfers()[0]?.stage).toBe('ready');
        expect(device.calls).toHaveLength(callsBefore);
    });

    it('stays on the transfers while a signed transaction is unsent, then shows the summary', async () => {
        const { controller, device, getTransfers, reachTransfers } = setup();
        await reachTransfers();
        await controller.ethereum.signTransfer(getTransfers()[0]!.key);

        await controller.finish();
        expect(controller.getState()).toMatchObject({
            step: 'ethereum-transfers',
            isDeviceLocked: true,
        });

        await controller.ethereum.broadcastTransfer(getTransfers()[0]!.key);
        await controller.finish();

        expect(controller.getState()).toMatchObject({ step: 'summary' });
        expect(device.countCalls('LockDevice')).toBe(1);
    });
});
