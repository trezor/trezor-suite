import { isWalletEmpty, scanAccount, scanAccountRange } from './discoverAccounts';
import { discoverWallet } from './discoverWallet';
import { buildScanReport } from './scanReport';
import { buildWalletScanReport } from './walletScanReport';
import { mockBackend, mockFundedAccount, mockFundedEthereumAddress } from '../../mocks/mockBackend';
import { type MockDeviceParams, mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';
import { createDeviceSession } from '../device/deviceSession';
import { validatePassphraseEntry } from '../device/passphrase';
import { ETHEREUM_CHAINS } from '../ethereum/ethereumChain';

const BACKEND_OFFLINE = { success: false, error: { type: 'backend', message: 'offline' } } as const;

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

describe('scanAccount', () => {
    it('scans the account once, with the deep address gap', async () => {
        const { wallet, chain, session } = setup();
        const { account } = mockFundedAccount({
            chain,
            wallet,
            accountType: 'p2sh',
            amounts: ['100000'],
        });

        const scanned = await scanAccount({
            call: session.call,
            backend: chain.backend,
            accountType: 'p2sh',
            accountIndex: 0,
        });

        expect(scanned).toMatchObject({ success: true, payload: { account, isEmpty: false } });
        expect(chain.backend.getAccountInfo.mock.calls).toEqual([
            [expect.objectContaining({ descriptor: account.descriptor, details: 'txs', gap: 100 })],
        ]);
    });

    it('reports an account without history as empty', async () => {
        const { chain, session } = setup();

        const scanned = await scanAccount({
            call: session.call,
            backend: chain.backend,
            accountType: 'p2pkh',
            accountIndex: 0,
        });

        expect(scanned.success && scanned.payload.isEmpty).toBe(true);
    });
});

describe('scanAccountRange', () => {
    it('walks the accounts until the first empty one and reports that one too', async () => {
        const { wallet, chain, session } = setup();
        [0, 1].forEach(accountIndex =>
            mockFundedAccount({
                chain,
                wallet,
                accountType: 'p2pkh',
                accountIndex,
                amounts: ['100000'],
            }),
        );
        const onAccountScanned = jest.fn();

        const scanned = await scanAccountRange({
            call: session.call,
            backend: chain.backend,
            accountType: 'p2pkh',
            firstIndex: 0,
            count: 20,
            stopAtFirstEmpty: true,
            onAccountScanned,
        });

        expect(
            scanned.success &&
                scanned.payload.map(({ account, isEmpty }) => [account.accountIndex, isEmpty]),
        ).toEqual([
            [0, false],
            [1, false],
            [2, true],
        ]);
        expect(onAccountScanned).toHaveBeenCalledTimes(3);
    });

    it('scans a fixed number of further accounts past empty ones on request', async () => {
        const { wallet, chain, session } = setup();
        // Account 4 was used although accounts 2 and 3 before it never were.
        mockFundedAccount({
            chain,
            wallet,
            accountType: 'p2pkh',
            accountIndex: 4,
            amounts: ['100000'],
        });

        const scanned = await scanAccountRange({
            call: session.call,
            backend: chain.backend,
            accountType: 'p2pkh',
            firstIndex: 2,
            count: 5,
            stopAtFirstEmpty: false,
        });

        expect(
            scanned.success &&
                scanned.payload.map(({ account, isEmpty }) => [account.accountIndex, isEmpty]),
        ).toEqual([
            [2, true],
            [3, true],
            [4, false],
            [5, true],
            [6, true],
        ]);
    });

    it('stops at a backend failure', async () => {
        const { chain, session } = setup();
        chain.backend.getAccountInfo.mockResolvedValue({
            success: false,
            error: { type: 'backend', message: 'offline' },
        });

        expect(
            await scanAccountRange({
                call: session.call,
                backend: chain.backend,
                accountType: 'p2pkh',
                firstIndex: 0,
                count: 20,
                stopAtFirstEmpty: true,
            }),
        ).toEqual({ success: false, error: { type: 'backend', message: 'offline' } });
    });

    it('stops at a wrong PIN without asking for it again', async () => {
        const { chain, device } = setup({ pin: '12' });
        const requestPin = jest.fn(() => Promise.resolve('99'));
        const session = createDeviceSession({
            transportCall: device.transportCall,
            getDeviceLostReason: () => undefined,
            requestPin,
            requestPassphrase: () => Promise.resolve(undefined),
            onButtonRequest: () => undefined,
        });

        const scanned = await scanAccountRange({
            call: session.call,
            backend: chain.backend,
            accountType: 'p2pkh',
            firstIndex: 0,
            count: 20,
            stopAtFirstEmpty: true,
        });

        expect(scanned).toMatchObject({
            success: false,
            error: { type: 'failure', code: 'Failure_PinInvalid' },
        });
        expect(requestPin).toHaveBeenCalledTimes(1);
        expect(device.countCalls('PinMatrixAck')).toBe(1);
    });
});

describe('discoverWallet', () => {
    it('scans every account type of the standard wallet', async () => {
        const { wallet, chain, session, device, setActivePassphrase } = setup();
        mockFundedAccount({ chain, wallet, accountType: 'p2sh', amounts: ['100000'] });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh', 'p2sh', 'p2wpkh'],
            ethereumChains: [],
            setActivePassphrase,
        });

        expect(
            discovered.success &&
                discovered.payload.accounts.map(({ account, isEmpty }) => [
                    account.accountType,
                    account.accountIndex,
                    isEmpty,
                ]),
        ).toEqual([
            ['p2pkh', 0, true],
            ['p2sh', 0, false],
            ['p2sh', 1, true],
            ['p2wpkh', 0, true],
        ]);
        expect(discovered.success && discovered.payload.walletKind).toBe('standard');
        expect(device.countCalls('Initialize')).toBe(0);
    });

    it('uses the normalized passphrase when its wallet has history', async () => {
        const typed = 'příliš';
        const candidates = validatePassphraseEntry({ first: typed, second: typed });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const hidden = mockWallet('aa'.repeat(16));
        const { chain, session, device, setActivePassphrase } = setup({
            hasPassphraseProtection: true,
            wallets: {
                [candidates.payload.normalized]: hidden,
                [typed]: mockWallet('bb'.repeat(16)),
            },
        });
        mockFundedAccount({ chain, wallet: hidden, accountType: 'p2pkh', amounts: ['100000'] });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: [],
            passphraseCandidates: candidates.payload,
            setActivePassphrase,
        });

        expect(discovered.success && discovered.payload.walletKind).toBe('passphrase-normalized');
        expect(
            device.calls.filter(({ name }) => name === 'PassphraseAck').map(({ data }) => data),
        ).toEqual([{ passphrase: candidates.payload.normalized }]);
    });

    it('falls back to the passphrase as typed when the normalized wallet is empty', async () => {
        const typed = 'příliš';
        const candidates = validatePassphraseEntry({ first: typed, second: typed });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const rawWallet = mockWallet('bb'.repeat(16));
        const { chain, session, device, setActivePassphrase } = setup({
            hasPassphraseProtection: true,
            wallets: {
                [candidates.payload.normalized]: mockWallet('aa'.repeat(16)),
                [typed]: rawWallet,
            },
        });
        const { account } = mockFundedAccount({
            chain,
            wallet: rawWallet,
            accountType: 'p2pkh',
            amounts: ['100000'],
        });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: [],
            passphraseCandidates: candidates.payload,
            setActivePassphrase,
        });

        expect(discovered).toMatchObject({
            success: true,
            payload: { walletKind: 'passphrase-raw', accounts: [{ account }, { isEmpty: true }] },
        });
        expect(
            device.calls.filter(({ name }) => name === 'PassphraseAck').map(({ data }) => data),
        ).toEqual([{ passphrase: candidates.payload.normalized }, { passphrase: typed }]);
    });

    it('returns to the normalized passphrase when both wallets are empty', async () => {
        const typed = 'příliš';
        const candidates = validatePassphraseEntry({ first: typed, second: typed });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const { chain, session, device, setActivePassphrase } = setup({
            hasPassphraseProtection: true,
            wallets: {
                [candidates.payload.normalized]: mockWallet('aa'.repeat(16)),
                [typed]: mockWallet('bb'.repeat(16)),
            },
        });
        const activePassphrases: string[] = [];

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: [],
            passphraseCandidates: candidates.payload,
            setActivePassphrase: passphrase => {
                activePassphrases.push(passphrase);
                setActivePassphrase(passphrase);
            },
        });

        expect(discovered.success && discovered.payload.walletKind).toBe('passphrase-normalized');
        expect(activePassphrases).toEqual([
            candidates.payload.normalized,
            typed,
            candidates.payload.normalized,
        ]);
        expect(device.countCalls('Initialize')).toBe(3);
    });

    it('does not try a second passphrase when normalization changes nothing', async () => {
        const candidates = validatePassphraseEntry({ first: 'plain', second: 'plain' });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const { chain, session, device, setActivePassphrase } = setup({
            hasPassphraseProtection: true,
            wallets: { plain: mockWallet('aa'.repeat(16)) },
        });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: [],
            passphraseCandidates: candidates.payload,
            setActivePassphrase,
        });

        expect(discovered.success && isWalletEmpty(discovered.payload.accounts)).toBe(true);
        expect(device.countCalls('PassphraseAck')).toBe(1);
    });

    it('scans the Ethereum chains after the Bitcoin accounts, on the same session', async () => {
        const { wallet, chain, session, device, setActivePassphrase } = setup();
        mockFundedAccount({ chain, wallet, accountType: 'p2pkh', amounts: ['100000'] });
        mockFundedEthereumAddress({ chain, wallet, ethereumChain: 'ethereum', balance: '1000' });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: ETHEREUM_CHAINS,
            setActivePassphrase,
        });

        expect(discovered).toMatchObject({
            success: true,
            payload: {
                walletKind: 'standard',
                accounts: [{ isEmpty: false }, { isEmpty: true }],
                ethereum: {
                    ethereum: { addresses: [{ isEmpty: false }, { isEmpty: true }] },
                    'ethereum-classic': {
                        addresses: [
                            { account: { slip44: 61 }, isEmpty: true },
                            { account: { slip44: 60 }, isEmpty: true },
                        ],
                    },
                },
            },
        });
        expect(device.calls.map(({ name }) => name)).toEqual([
            ...Array<string>(4).fill('GetPublicKey'),
            ...Array<string>(4).fill('EthereumGetAddress'),
        ]);
    });

    it('keeps the other coins when the server of one of them fails', async () => {
        const { wallet, chain, session, setActivePassphrase } = setup();
        mockFundedAccount({ chain, wallet, accountType: 'p2pkh', amounts: ['100000'] });
        chain.backend.ethereum.ethereum.getAccountInfo.mockResolvedValue(BACKEND_OFFLINE);

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: ETHEREUM_CHAINS,
            setActivePassphrase,
        });

        expect(discovered).toMatchObject({
            success: true,
            payload: {
                accounts: [{ isEmpty: false }, { isEmpty: true }],
                bitcoinError: undefined,
                ethereum: {
                    ethereum: { addresses: [], error: BACKEND_OFFLINE.error },
                    'ethereum-classic': { addresses: [{}, {}], error: undefined },
                },
            },
        });
    });

    it('does not try the raw passphrase while a server failure leaves a coin unknown', async () => {
        const typed = 'příliš';
        const candidates = validatePassphraseEntry({ first: typed, second: typed });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const { chain, session, device, setActivePassphrase } = setup({
            hasPassphraseProtection: true,
            wallets: {
                [candidates.payload.normalized]: mockWallet('aa'.repeat(16)),
                [typed]: mockWallet('bb'.repeat(16)),
            },
        });
        chain.backend.getAccountInfo.mockResolvedValue(BACKEND_OFFLINE);

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: ETHEREUM_CHAINS,
            passphraseCandidates: candidates.payload,
            setActivePassphrase,
        });

        expect(discovered).toMatchObject({
            success: true,
            payload: {
                walletKind: 'passphrase-normalized',
                accounts: [],
                bitcoinError: BACKEND_OFFLINE.error,
            },
        });
        expect(device.countCalls('PassphraseAck')).toBe(1);
    });

    it('calls the wallet under an empty passphrase the standard wallet', async () => {
        const candidates = validatePassphraseEntry({ first: '', second: '' });
        if (!candidates.success) throw new Error('test passphrase must be valid');

        const { chain, session, device, setActivePassphrase } = setup({
            hasPassphraseProtection: true,
        });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: [],
            passphraseCandidates: candidates.payload,
            setActivePassphrase,
        });

        expect(discovered.success && discovered.payload.walletKind).toBe('standard');
        expect(
            device.calls.filter(({ name }) => name === 'PassphraseAck').map(({ data }) => data),
        ).toEqual([{ passphrase: '' }]);
    });
});

describe('buildScanReport', () => {
    it('describes what was scanned and names the account types that were not', async () => {
        const { wallet, chain, session, setActivePassphrase } = setup();
        mockFundedAccount({ chain, wallet, accountType: 'p2pkh', amounts: ['100000'] });

        const discovered = await discoverWallet({
            call: session.call,
            backend: chain.backend,
            accountTypes: ['p2pkh', 'p2sh'],
            ethereumChains: [],
            setActivePassphrase,
        });
        if (!discovered.success) throw new Error('discovery must succeed');

        expect(
            buildScanReport({
                accounts: discovered.payload.accounts,
                scannedAccountTypes: ['p2pkh', 'p2sh'],
                walletKind: discovered.payload.walletKind,
            }),
        ).toEqual({
            coin: 'Bitcoin',
            walletKind: 'standard',
            addressGap: 100,
            accountTypes: [
                {
                    accountType: 'p2pkh',
                    label: 'Legacy',
                    scannedAccounts: 2,
                    usedAccounts: 1,
                    firstPath: "m/44'/0'/0'",
                    lastPath: "m/44'/0'/1'",
                },
                {
                    accountType: 'p2sh',
                    label: 'Legacy SegWit',
                    scannedAccounts: 1,
                    usedAccounts: 0,
                    firstPath: "m/49'/0'/0'",
                    lastPath: "m/49'/0'/0'",
                },
            ],
            skippedAccountTypes: ['SegWit', 'Taproot'],
        });
    });
});

describe('buildWalletScanReport', () => {
    it('lists every coin that was scanned and names the ones whose scan was cut short', async () => {
        const { wallet, chain: backend, session, setActivePassphrase } = setup();
        mockFundedAccount({ chain: backend, wallet, accountType: 'p2pkh', amounts: ['100000'] });
        mockFundedEthereumAddress({
            chain: backend,
            wallet,
            ethereumChain: 'ethereum',
            balance: '1000',
        });
        const discovered = await discoverWallet({
            call: session.call,
            backend: backend.backend,
            accountTypes: ['p2pkh'],
            ethereumChains: ETHEREUM_CHAINS,
            setActivePassphrase,
        });
        if (!discovered.success) throw new Error('discovery must succeed');

        const { walletKind, accounts, ethereum } = discovered.payload;
        const report = buildWalletScanReport({
            walletKind,
            accounts,
            scannedAccountTypes: ['p2pkh'],
            isBitcoinInterrupted: false,
            ethereum: ETHEREUM_CHAINS.map(chain => ({
                chain,
                addresses: ethereum[chain].addresses,
                isInterrupted: chain === 'ethereum-classic',
            })),
        });

        expect(report).toMatchObject({
            walletKind: 'standard',
            bitcoin: {
                accountTypes: [{ accountType: 'p2pkh', scannedAccounts: 2, usedAccounts: 1 }],
            },
            interruptedCoins: ['Ethereum Classic'],
        });
        expect(
            report.ethereum.map(({ chain, pathFamilies }) => [chain, pathFamilies.length]),
        ).toEqual([
            ['ethereum', 1],
            ['ethereum-classic', 2],
        ]);
    });

    it('lists no Ethereum chain when the firmware cannot sign for them', () => {
        const report = buildWalletScanReport({
            walletKind: 'standard',
            accounts: [],
            scannedAccountTypes: ['p2pkh'],
            isBitcoinInterrupted: false,
            ethereum: [],
        });

        expect(report).toMatchObject({ ethereum: [], interruptedCoins: [] });
    });
});
