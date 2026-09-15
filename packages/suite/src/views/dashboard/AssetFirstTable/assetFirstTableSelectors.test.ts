import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AssetFirstTableState, selectAssetFirstTableKeys } from './assetFirstTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const USDC_ON_POL = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' as TokenAddress;
const UNKNOWN_TOKEN = '0x0000000000000000000000000000000000000bad' as TokenAddress;

type MockAccountParams = {
    deviceState?: StaticSessionId;
    symbol?: Account['symbol'];
    index?: number;
    balance?: string;
    isVisible?: boolean;
    tokens?: { contract: TokenAddress; balance: string }[];
};

const mockAccount = ({
    deviceState = ALICE,
    symbol = 'eth',
    index = 0,
    balance = '1',
    isVisible = true,
    tokens = [],
}: MockAccountParams = {}): Account =>
    ({
        key: `descriptor${index}-${symbol}-${deviceState}`,
        deviceState,
        symbol,
        index,
        accountType: 'normal',
        formattedBalance: balance,
        visible: isVisible,
        tokens,
    }) as unknown as Account;

const mockRate = (symbol: Account['symbol'], rate: number, contract?: TokenAddress) => ({
    [getFiatRateKey(symbol, 'usd', contract)]: { rate },
});

type MockStateParams = {
    accounts: Account[];
    enabledNetworks?: Account['symbol'][];
    rates?: Record<string, { rate: number }>;
    knownTokens?: TokenAddress[];
    hiddenTokens?: TokenAddress[];
    shownTokens?: TokenAddress[];
};

const createState = ({
    accounts,
    enabledNetworks = ['btc', 'eth', 'pol'],
    rates = {},
    knownTokens = [USDC_ON_ETH, USDC_ON_POL],
    hiddenTokens = [],
    shownTokens = [],
}: MockStateParams): AssetFirstTableState => {
    const definitions = {
        coin: { data: knownTokens, hide: hiddenTokens, show: shownTokens },
    };

    return {
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            settings: { enabledNetworks, localCurrency: 'usd' },
            fiat: { current: rates, lastWeek: {}, historic: {} },
        },
        // `dsol` has no `coin-definitions` feature, which is what makes it the testnet case below.
        tokenDefinitions: { eth: definitions, pol: definitions, dsol: definitions },
    } as unknown as AssetFirstTableState;
};

describe('selectAssetFirstTableKeys', () => {
    it('lists one key per asset and network', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: 'eth', tokens: [{ contract: USDC_ON_ETH, balance: '10' }] }),
                mockAccount({ symbol: 'btc', index: 1 }),
            ],
        });

        expect(selectAssetFirstTableKeys(state)).toEqual(
            expect.arrayContaining([
                `${ALICE}/eth/`,
                `${ALICE}/eth/${USDC_ON_ETH}`,
                `${ALICE}/btc/`,
            ]),
        );
    });

    it('keeps the networks holding one asset together, most valuable asset first', () => {
        // What the design reads like: the asset a wallet holds most of at the top, and every
        // network it is held on directly underneath — not interleaved with the next asset.
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: 'eth',
                    balance: '2',
                    tokens: [{ contract: USDC_ON_ETH, balance: '2400' }],
                }),
                mockAccount({
                    symbol: 'pol',
                    index: 1,
                    balance: '10',
                    tokens: [{ contract: USDC_ON_POL, balance: '720' }],
                }),
            ],
            rates: {
                ...mockRate('eth', 3000),
                ...mockRate('pol', 0.5),
                ...mockRate('eth', 1, USDC_ON_ETH),
                ...mockRate('pol', 1, USDC_ON_POL),
            },
        });

        expect(selectAssetFirstTableKeys(state)).toEqual([
            // ETH, 6000
            `${ALICE}/eth/`,
            // USDC, 2400 + 720, with the bigger holding first
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/pol/${USDC_ON_POL}`,
            // POL, 5
            `${ALICE}/pol/`,
        ]);
    });

    it('leaves out a network the user has not enabled', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: 'btc' })],
            enabledNetworks: ['eth'],
        });

        expect(selectAssetFirstTableKeys(state)).toEqual([]);
    });

    it('leaves out a token nothing vouches for', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [
                        { contract: USDC_ON_ETH, balance: '10' },
                        { contract: UNKNOWN_TOKEN, balance: '999999' },
                    ],
                }),
            ],
        });

        expect(selectAssetFirstTableKeys(state)).not.toContain(`${ALICE}/eth/${UNKNOWN_TOKEN}`);
    });

    it('leaves out a token the user hid', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '10' }] })],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectAssetFirstTableKeys(state)).not.toContain(`${ALICE}/eth/${USDC_ON_ETH}`);
    });

    it('keeps a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '10' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(selectAssetFirstTableKeys(state)).toContain(`${ALICE}/eth/${UNKNOWN_TOKEN}`);
    });

    it('keeps the tokens of a network that has no definitions at all', () => {
        // `dsol` and the other testnets have no `coin-definitions` feature, so nothing can vouch
        // for their tokens and nothing needs to.
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: 'dsol',
                    tokens: [{ contract: UNKNOWN_TOKEN, balance: '3' }],
                }),
            ],
            enabledNetworks: ['dsol'],
            knownTokens: [],
        });

        expect(selectAssetFirstTableKeys(state)).toContain(`${ALICE}/dsol/${UNKNOWN_TOKEN}`);
    });

    it('leaves out an account the user hid', () => {
        const state = createState({
            accounts: [mockAccount({ symbol: 'btc', isVisible: false })],
        });

        expect(selectAssetFirstTableKeys(state)).toEqual([]);
    });

    it('leaves out another wallet’s assets', () => {
        const state = createState({
            accounts: [mockAccount({ deviceState: BOB, symbol: 'btc' })],
        });

        expect(selectAssetFirstTableKeys(state)).toEqual([]);
    });

    it('hands back the same list while nothing it reads has changed', () => {
        const state = createState({ accounts: [mockAccount()] });

        expect(selectAssetFirstTableKeys(state)).toBe(selectAssetFirstTableKeys(state));
    });
});
