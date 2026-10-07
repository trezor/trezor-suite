import {
    MAX_AUTOMATIC_ETHEREUM_ADDRESSES,
    isEthereumWalletEmpty,
    scanEthereumAddressRange,
    scanEthereumPathFamilies,
} from './discoverEthereumAddresses';
import { discoverEthereumWallet } from './discoverEthereumWallet';
import { buildEthereumScanReport } from './ethereumScanReport';
import { mockAccountInfo } from '../../mocks/mockAccountInfo';
import { mockBackend, mockFundedEthereumAddress } from '../../mocks/mockBackend';
import { type MockDeviceParams, mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';
import { createDeviceSession } from '../device/deviceSession';
import { validatePassphraseEntry } from '../device/passphrase';
import type { EthereumChain } from '../ethereum/ethereumChain';

const setup = (deviceParams: Partial<MockDeviceParams> = {}) => {
    const wallet = mockWallet();
    const chain = mockBackend();
    const device = mockDevice({ wallets: { '': wallet }, ...deviceParams });
    let activePassphrase: string | undefined;
    const session = createDeviceSession({
        transportCall: device.transportCall,
        getDeviceLostReason: () => undefined,
        requestPin: () => Promise.resolve(undefined),
        requestPassphrase: () => Promise.resolve(activePassphrase),
        onButtonRequest: () => undefined,
    });

    return {
        wallet,
        chain,
        device,
        session,
        setActivePassphrase: (passphrase: string) => {
            activePassphrase = passphrase;
        },
    };
};

const describeScanned = (
    scanned: Awaited<ReturnType<typeof scanEthereumPathFamilies>>,
): unknown[] | false =>
    scanned.success &&
    scanned.payload.map(({ account, isEmpty }) => [account.slip44, account.index, isEmpty]);

describe('scanEthereumPathFamilies', () => {
    it('walks the Ethereum path until the first address that was never used', async () => {
        const { wallet, chain, session, device } = setup();
        [0, 1].forEach(index =>
            mockFundedEthereumAddress({
                chain,
                wallet,
                ethereumChain: 'ethereum',
                index,
                balance: '1000',
            }),
        );
        const onAddressScanned = jest.fn();

        const scanned = await scanEthereumPathFamilies({
            call: session.call,
            backend: chain.backend.ethereum.ethereum,
            chain: 'ethereum',
            onAddressScanned,
        });

        expect(describeScanned(scanned)).toEqual([
            [60, 0, false],
            [60, 1, false],
            [60, 2, true],
        ]);
        expect(onAddressScanned).toHaveBeenCalledTimes(3);
        // The device was asked without show_display, so it never asked for a confirmation.
        expect(device.calls.map(({ name, data }) => [name, Object.keys(data)])).toEqual([
            ['EthereumGetAddress', ['address_n']],
            ['EthereumGetAddress', ['address_n']],
            ['EthereumGetAddress', ['address_n']],
        ]);
        expect(device.countCalls('ButtonAck')).toBe(0);
    });

    it('treats an address with history but no balance as used', async () => {
        const { wallet, chain, session } = setup();
        mockFundedEthereumAddress({
            chain,
            wallet,
            ethereumChain: 'ethereum',
            index: 0,
            balance: '0',
            transactions: 3,
            nonce: '2',
        });

        const scanned = await scanEthereumPathFamilies({
            call: session.call,
            backend: chain.backend.ethereum.ethereum,
            chain: 'ethereum',
        });

        expect(describeScanned(scanned)).toEqual([
            [60, 0, false],
            [60, 1, true],
        ]);
    });

    it('scans both the Ethereum Classic and the Ethereum paths for Ethereum Classic', async () => {
        const { wallet, chain, session } = setup();
        mockFundedEthereumAddress({
            chain,
            wallet,
            ethereumChain: 'ethereum-classic',
            slip44: 61,
            index: 0,
            balance: '1000',
        });
        mockFundedEthereumAddress({
            chain,
            wallet,
            ethereumChain: 'ethereum-classic',
            slip44: 60,
            index: 0,
            balance: '2000',
        });

        const scanned = await scanEthereumPathFamilies({
            call: session.call,
            backend: chain.backend.ethereum['ethereum-classic'],
            chain: 'ethereum-classic',
        });

        expect(describeScanned(scanned)).toEqual([
            [61, 0, false],
            [61, 1, true],
            [60, 0, false],
            [60, 1, true],
        ]);
        // Only the Ethereum Classic blockbook was asked.
        expect(chain.backend.ethereum.ethereum.getAccountInfo).not.toHaveBeenCalled();
        expect(chain.backend.ethereum['ethereum-classic'].getAccountInfo).toHaveBeenCalledTimes(4);
    });

    it('stops after the hard limit even when every address looks used', async () => {
        const { chain, session } = setup();
        chain.backend.ethereum.ethereum.getAccountInfo.mockImplementation(address =>
            Promise.resolve({
                success: true,
                payload: mockAccountInfo({
                    descriptor: address,
                    empty: false,
                    balance: '1',
                    history: { total: 1, unconfirmed: 0 },
                    misc: { nonce: '1' },
                }),
            }),
        );

        const scanned = await scanEthereumPathFamilies({
            call: session.call,
            backend: chain.backend.ethereum.ethereum,
            chain: 'ethereum',
        });

        expect(scanned.success && scanned.payload).toHaveLength(MAX_AUTOMATIC_ETHEREUM_ADDRESSES);
    });

    it('stops at a backend failure', async () => {
        const { chain, session } = setup();
        chain.backend.ethereum.ethereum.getAccountInfo.mockResolvedValue({
            success: false,
            error: { type: 'backend', message: 'offline' },
        });

        expect(
            await scanEthereumPathFamilies({
                call: session.call,
                backend: chain.backend.ethereum.ethereum,
                chain: 'ethereum',
            }),
        ).toEqual({ success: false, error: { type: 'backend', message: 'offline' } });
    });
});

describe('scanEthereumAddressRange', () => {
    it('scans a fixed number of further addresses past empty ones on request', async () => {
        const { wallet, chain, session } = setup();
        mockFundedEthereumAddress({
            chain,
            wallet,
            ethereumChain: 'ethereum',
            index: 5,
            balance: '1000',
        });

        const scanned = await scanEthereumAddressRange({
            call: session.call,
            backend: chain.backend.ethereum.ethereum,
            chain: 'ethereum',
            slip44: 60,
            firstIndex: 3,
            count: 5,
            stopAtFirstEmpty: false,
        });

        expect(describeScanned(scanned)).toEqual([
            [60, 3, true],
            [60, 4, true],
            [60, 5, false],
            [60, 6, true],
            [60, 7, true],
        ]);
    });
});

describe('discoverEthereumWallet', () => {
    const discover = (
        context: ReturnType<typeof setup>,
        chain: EthereumChain,
        passphraseCandidates?: ReturnType<typeof validatePassphraseEntry> extends infer R
            ? R extends { success: true; payload: infer P }
                ? P
                : never
            : never,
    ) =>
        discoverEthereumWallet({
            call: context.session.call,
            backend: context.chain.backend.ethereum[chain],
            chain,
            passphraseCandidates,
            setActivePassphrase: context.setActivePassphrase,
        });

    it('scans the standard wallet without touching the passphrase', async () => {
        const context = setup();
        mockFundedEthereumAddress({
            chain: context.chain,
            wallet: context.wallet,
            ethereumChain: 'ethereum',
            balance: '1000',
        });

        const discovered = await discover(context, 'ethereum');

        expect(discovered.success && discovered.payload.walletKind).toBe('standard');
        expect(discovered.success && discovered.payload.addresses).toHaveLength(2);
        expect(context.device.countCalls('Initialize')).toBe(0);
    });

    it('falls back to the passphrase as typed when the normalized wallet is empty', async () => {
        const typed = 'příliš';
        const candidates = validatePassphraseEntry({ first: typed, second: typed });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const rawWallet = mockWallet('bb'.repeat(16));
        const context = setup({
            hasPassphraseProtection: true,
            wallets: {
                [candidates.payload.normalized]: mockWallet('aa'.repeat(16)),
                [typed]: rawWallet,
            },
        });
        const { account } = mockFundedEthereumAddress({
            chain: context.chain,
            wallet: rawWallet,
            ethereumChain: 'ethereum',
            balance: '1000',
        });

        const discovered = await discover(context, 'ethereum', candidates.payload);

        expect(discovered).toMatchObject({
            success: true,
            payload: { walletKind: 'passphrase-raw', addresses: [{ account }, { isEmpty: true }] },
        });
        expect(
            context.device.calls
                .filter(({ name }) => name === 'PassphraseAck')
                .map(({ data }) => data),
        ).toEqual([{ passphrase: candidates.payload.normalized }, { passphrase: typed }]);
    });
});

describe('buildEthereumScanReport', () => {
    it('describes every path family of the chain', async () => {
        const { wallet, chain, session } = setup();
        mockFundedEthereumAddress({
            chain,
            wallet,
            ethereumChain: 'ethereum-classic',
            slip44: 60,
            index: 0,
            balance: '1000',
        });
        const scanned = await scanEthereumPathFamilies({
            call: session.call,
            backend: chain.backend.ethereum['ethereum-classic'],
            chain: 'ethereum-classic',
        });
        if (!scanned.success) throw new Error('scan must succeed');

        expect(isEthereumWalletEmpty(scanned.payload)).toBe(false);
        expect(
            buildEthereumScanReport({
                chain: 'ethereum-classic',
                addresses: scanned.payload,
                walletKind: 'standard',
            }),
        ).toEqual({
            chain: 'ethereum-classic',
            label: 'Ethereum Classic',
            symbol: 'ETC',
            walletKind: 'standard',
            pathFamilies: [
                { slip44: 61, pattern: "m/44'/61'/0'/0/i", scannedAddresses: 1, usedAddresses: 0 },
                { slip44: 60, pattern: "m/44'/60'/0'/0/i", scannedAddresses: 2, usedAddresses: 1 },
            ],
        });
    });
});
