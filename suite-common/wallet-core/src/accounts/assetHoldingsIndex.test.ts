import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetHoldingsRootState,
    assetHoldingsIndex,
    getAssetKey,
    parseAssetKey,
    selectAccountAssetHoldings,
    selectAssetHoldings,
    selectAssetKeysByDeviceState,
    selectHiddenAssetHoldingKeys,
    selectShownAssetHoldings,
} from './assetHoldingsIndex';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');
const DSOL = asNetworkSymbol('dsol');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const USDT_ON_ETH = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
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
    symbol = ETH,
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
        formattedBalance: balance,
        visible: isVisible,
        tokens,
    }) as unknown as Account;

type MockStateParams = {
    accounts: Account[];
    knownTokens?: TokenAddress[];
    hiddenTokens?: TokenAddress[];
    shownTokens?: TokenAddress[];
};

const createState = ({
    accounts,
    knownTokens = [USDC_ON_ETH, USDT_ON_ETH],
    hiddenTokens = [],
    shownTokens = [],
}: MockStateParams): AssetHoldingsRootState => {
    const definitions = {
        coin: { data: knownTokens, hide: hiddenTokens, show: shownTokens },
    };

    return {
        wallet: { accounts },
        tokenDefinitions: { eth: definitions, dsol: definitions },
    } as unknown as AssetHoldingsRootState;
};

const aliceCoin = getAssetKey({ deviceState: ALICE, symbol: ETH });
const aliceUsdc = getAssetKey({
    deviceState: ALICE,
    symbol: ETH,
    contractAddress: USDC_ON_ETH,
});

describe('which holdings the user is shown', () => {
    const contractsOf = (holdings: readonly { contractAddress?: TokenAddress | undefined }[]) =>
        holdings.map(holding => holding.contractAddress);

    it('leaves out a token the user hid', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] })],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(contractsOf(selectShownAssetHoldings(state))).toEqual([undefined]);
    });

    it('leaves out a token nothing vouches for', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '7' }] })],
        });

        expect(contractsOf(selectShownAssetHoldings(state))).toEqual([undefined]);
    });

    it('keeps a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '7' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(contractsOf(selectShownAssetHoldings(state))).toEqual([undefined, UNKNOWN_TOKEN]);
    });

    it('keeps a token the user hid even when it is also on the shown list', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] })],
            hiddenTokens: [USDC_ON_ETH],
            shownTokens: [USDC_ON_ETH],
        });

        expect(contractsOf(selectShownAssetHoldings(state))).toEqual([undefined]);
    });

    it('keeps every token on a network with no definitions to go by', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: DSOL, tokens: [{ contract: UNKNOWN_TOKEN, balance: '3' }] }),
            ],
        });

        expect(contractsOf(selectShownAssetHoldings(state))).toEqual([undefined, UNKNOWN_TOKEN]);
    });

    it('names the hidden holdings of every account that holds one', () => {
        const state = createState({
            accounts: [
                mockAccount({ index: 0, tokens: [{ contract: USDC_ON_ETH, balance: '1' }] }),
                mockAccount({ index: 1, tokens: [{ contract: USDC_ON_ETH, balance: '2' }] }),
            ],
            hiddenTokens: [USDC_ON_ETH],
        });

        expect(selectHiddenAssetHoldingKeys(state)).toHaveLength(2);
    });

    it('names nothing when the user hid nothing', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '1' }] })],
        });

        expect(selectHiddenAssetHoldingKeys(state)).toEqual([]);
    });

    it('hands back the same holdings while the accounts and the hiding are unchanged', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '1' }] })],
        });

        expect(selectShownAssetHoldings(state)).toBe(selectShownAssetHoldings(state));
    });
});

describe('getAssetKey', () => {
    it('is the wallet, the network and the contract', () => {
        expect(aliceUsdc).toBe(`${ALICE}/eth/${USDC_ON_ETH}`);
    });

    it('reads back what it wrote', () => {
        expect(parseAssetKey(aliceUsdc)).toEqual({
            deviceState: ALICE,
            symbol: ETH,
            contractAddress: USDC_ON_ETH,
        });
    });

    it('reads a coin back as having no contract', () => {
        expect(parseAssetKey(aliceCoin)).toEqual({
            deviceState: ALICE,
            symbol: ETH,
            contractAddress: undefined,
        });
    });

    it('answers with nothing for a key that is not one of ours', () => {
        expect(parseAssetKey('whatever')).toBeUndefined();
    });
});

describe('what becomes a holding', () => {
    it('is the account’s own coin, always', () => {
        const state = createState({ accounts: [mockAccount({ balance: '2.5' })] });

        expect(selectAssetHoldings(state, aliceCoin)).toEqual([
            expect.objectContaining({ cryptoBalance: '2.5', contractAddress: undefined }),
        ]);
    });

    it('is each token the account holds', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] })],
        });

        expect(selectAssetHoldings(state, aliceUsdc)).toEqual([
            expect.objectContaining({ cryptoBalance: '100', contractAddress: USDC_ON_ETH }),
        ]);
    });

    it('is not a token with no balance', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '0' }] })],
        });

        expect(selectAssetHoldings(state, aliceUsdc)).toEqual([]);
    });

    it('is a token the user asked to see, definition or not', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [{ contract: UNKNOWN_TOKEN, balance: '7' }] })],
            shownTokens: [UNKNOWN_TOKEN],
        });

        expect(
            selectAssetHoldings(
                state,
                getAssetKey({ deviceState: ALICE, symbol: ETH, contractAddress: UNKNOWN_TOKEN }),
            ),
        ).toHaveLength(1);
    });

    it('is any token on a network that has no definitions at all', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: DSOL,
                    tokens: [{ contract: UNKNOWN_TOKEN, balance: '3' }],
                }),
            ],
            knownTokens: [],
        });

        expect(
            selectAssetHoldings(
                state,
                getAssetKey({ deviceState: ALICE, symbol: DSOL, contractAddress: UNKNOWN_TOKEN }),
            ),
        ).toHaveLength(1);
    });
});

describe('the groups a holding is in', () => {
    it('puts every account’s holding of one asset under that asset', () => {
        const state = createState({
            accounts: [
                mockAccount({ index: 0, tokens: [{ contract: USDC_ON_ETH, balance: '100' }] }),
                mockAccount({ index: 1, tokens: [{ contract: USDC_ON_ETH, balance: '40' }] }),
            ],
        });

        expect(selectAssetHoldings(state, aliceUsdc).map(holding => holding.cryptoBalance)).toEqual(
            ['100', '40'],
        );
    });

    it('keeps the same token in two wallets apart', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    deviceState: ALICE,
                    tokens: [{ contract: USDC_ON_ETH, balance: '1' }],
                }),
                mockAccount({
                    deviceState: BOB,
                    tokens: [{ contract: USDC_ON_ETH, balance: '9' }],
                }),
            ],
        });

        expect(
            selectAssetHoldings(
                state,
                getAssetKey({ deviceState: BOB, symbol: ETH, contractAddress: USDC_ON_ETH }),
            ).map(holding => holding.cryptoBalance),
        ).toEqual(['9']);
    });

    it('puts an account’s coin and tokens under that account', () => {
        const account = mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] });
        const state = createState({ accounts: [account] });

        expect(selectAccountAssetHoldings(state, account.key)).toHaveLength(2);
    });

    it('lists every asset one wallet holds', () => {
        const state = createState({
            accounts: [
                mockAccount({ symbol: ETH, tokens: [{ contract: USDC_ON_ETH, balance: '100' }] }),
                mockAccount({ deviceState: BOB, index: 1 }),
            ],
        });

        expect(selectAssetKeysByDeviceState(state, ALICE)).toEqual([aliceCoin, aliceUsdc]);
    });
});

describe('what a write leaves alone', () => {
    it('hands back the same holdings for an account nothing touched', () => {
        const untouched = mockAccount({ symbol: BTC, index: 0 });
        const before = mockAccount({ symbol: ETH, index: 1, balance: '1' });
        const bitcoinKey = getAssetKey({ deviceState: ALICE, symbol: BTC });

        const firstHoldings = selectAssetHoldings(
            createState({ accounts: [untouched, before] }),
            bitcoinKey,
        );
        const afterWrite = selectAssetHoldings(
            createState({ accounts: [untouched, { ...before, formattedBalance: '2' }] }),
            bitcoinKey,
        );

        expect(afterWrite).toBe(firstHoldings);
    });

    it('follows the account that was written', () => {
        const before = mockAccount({ balance: '1' });
        const state = createState({ accounts: [before] });

        expect(selectAssetHoldings(state, aliceCoin)[0]?.cryptoBalance).toBe('1');
        expect(
            selectAssetHoldings(
                createState({ accounts: [{ ...before, formattedBalance: '3' }] }),
                aliceCoin,
            )[0]?.cryptoBalance,
        ).toBe('3');
    });

    it('keeps the holdings of an account nothing wrote to', () => {
        const untouched = mockAccount({ index: 0 });
        const before = selectAssetHoldings(
            createState({ accounts: [untouched, mockAccount({ index: 1, balance: '1' })] }),
            aliceCoin,
        );

        const after = selectAssetHoldings(
            createState({ accounts: [untouched, mockAccount({ index: 1, balance: '2' })] }),
            aliceCoin,
        );

        expect(after[0]).toBe(before[0]);
    });

    it('builds an account’s holdings once for repeated reads', () => {
        const state = createState({ accounts: [mockAccount()] });

        expect(assetHoldingsIndex.read(state)).toBe(assetHoldingsIndex.read(state));
    });
});
