import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    accountsIndex,
    getAccountAssetKey,
    parseAccountAssetKey,
    selectAccountsByAssetKey,
    selectAssetKeysByDeviceState,
} from './accountsIndex';
import { type AccountsRootState } from './accountsReducer';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const USDT_ON_ETH = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;

type MockAccountParams = {
    deviceState?: StaticSessionId;
    symbol?: Account['symbol'];
    index?: number;
    balance?: string;
    tokens?: { contract: TokenAddress; balance: string }[];
};

const mockAccount = ({
    deviceState = ALICE,
    symbol = 'eth',
    index = 0,
    balance = '1',
    tokens = [],
}: MockAccountParams = {}): Account =>
    ({
        key: `descriptor${index}-${symbol}-${deviceState}`,
        deviceState,
        symbol,
        index,
        formattedBalance: balance,
        visible: true,
        tokens: tokens.map(token => ({ ...token, type: 'ERC20' })),
    }) as unknown as Account;

const createState = (accounts: Account[]): AccountsRootState =>
    ({ wallet: { accounts } }) as AccountsRootState;

describe('getAccountAssetKey', () => {
    it('is the wallet, the network and the contract', () => {
        expect(
            getAccountAssetKey({ deviceState: ALICE, symbol: 'eth', contractAddress: USDC_ON_ETH }),
        ).toBe(`${ALICE}/eth/${USDC_ON_ETH}`);
    });

    it('leaves the contract empty for the network’s own coin', () => {
        expect(getAccountAssetKey({ deviceState: ALICE, symbol: 'btc' })).toBe(`${ALICE}/btc/`);
    });

    it('reads back what it wrote', () => {
        const key = getAccountAssetKey({
            deviceState: ALICE,
            symbol: 'pol',
            contractAddress: USDC_ON_ETH,
        });

        expect(parseAccountAssetKey(key)).toEqual({
            deviceState: ALICE,
            symbol: 'pol',
            contractAddress: USDC_ON_ETH,
        });
    });

    it('reads back a coin as having no contract', () => {
        expect(
            parseAccountAssetKey(getAccountAssetKey({ deviceState: BOB, symbol: 'sol' })),
        ).toEqual({ deviceState: BOB, symbol: 'sol', contractAddress: undefined });
    });

    it('answers with nothing for a key that is not one of ours', () => {
        expect(parseAccountAssetKey('whatever')).toBeUndefined();
    });
});

describe('accountsIndex', () => {
    it('finds an account by its key', () => {
        const account = mockAccount();

        expect(accountsIndex.getById(createState([account]), account.key)).toBe(account);
    });

    it('groups the accounts of one wallet', () => {
        const alice = mockAccount({ deviceState: ALICE });
        const bob = mockAccount({ deviceState: BOB });

        expect(accountsIndex.getBy(createState([alice, bob]), 'byDeviceState', ALICE)).toEqual([
            alice,
        ]);
    });

    it('groups the accounts of one network', () => {
        const ethereum = mockAccount({ symbol: 'eth' });
        const bitcoin = mockAccount({ symbol: 'btc' });

        expect(
            accountsIndex.getBy(createState([ethereum, bitcoin]), 'byNetworkSymbol', 'btc'),
        ).toEqual([bitcoin]);
    });

    it('puts every account on a network under that network’s coin', () => {
        // Which is what makes a row out of them: one line for the coin, however many accounts the
        // wallet has on it.
        const first = mockAccount({ index: 0 });
        const second = mockAccount({ index: 1 });
        const state = createState([first, second]);

        expect(
            selectAccountsByAssetKey(
                state,
                getAccountAssetKey({ deviceState: ALICE, symbol: 'eth' }),
            ),
        ).toEqual([first, second]);
    });

    it('puts an account under each token it holds', () => {
        const account = mockAccount({
            tokens: [
                { contract: USDC_ON_ETH, balance: '100' },
                { contract: USDT_ON_ETH, balance: '5' },
            ],
        });
        const state = createState([account]);

        expect(
            selectAccountsByAssetKey(
                state,
                getAccountAssetKey({
                    deviceState: ALICE,
                    symbol: 'eth',
                    contractAddress: USDT_ON_ETH,
                }),
            ),
        ).toEqual([account]);
    });

    it('leaves out a token the account has no balance of', () => {
        const state = createState([
            mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '0' }] }),
        ]);

        expect(
            selectAccountsByAssetKey(
                state,
                getAccountAssetKey({
                    deviceState: ALICE,
                    symbol: 'eth',
                    contractAddress: USDC_ON_ETH,
                }),
            ),
        ).toEqual([]);
    });

    it('keeps the same token in two wallets apart', () => {
        const aliceAccount = mockAccount({
            deviceState: ALICE,
            tokens: [{ contract: USDC_ON_ETH, balance: '100' }],
        });
        const bobAccount = mockAccount({
            deviceState: BOB,
            tokens: [{ contract: USDC_ON_ETH, balance: '7' }],
        });
        const state = createState([aliceAccount, bobAccount]);

        expect(
            selectAccountsByAssetKey(
                state,
                getAccountAssetKey({
                    deviceState: BOB,
                    symbol: 'eth',
                    contractAddress: USDC_ON_ETH,
                }),
            ),
        ).toEqual([bobAccount]);
    });

    it('lists every asset one wallet holds', () => {
        const state = createState([
            mockAccount({ symbol: 'eth', tokens: [{ contract: USDC_ON_ETH, balance: '100' }] }),
            mockAccount({ symbol: 'btc', index: 1 }),
            mockAccount({ deviceState: BOB, symbol: 'sol' }),
        ]);

        expect(selectAssetKeysByDeviceState(state, ALICE)).toEqual([
            `${ALICE}/eth/`,
            `${ALICE}/eth/${USDC_ON_ETH}`,
            `${ALICE}/btc/`,
        ]);
    });

    it('hands back the same list while the accounts are unchanged', () => {
        const state = createState([mockAccount()]);

        expect(selectAssetKeysByDeviceState(state, ALICE)).toBe(
            selectAssetKeysByDeviceState(state, ALICE),
        );
    });

    it('keeps a group identical when another account is written', () => {
        // What a row watching its own asset relies on: a write to another account leaves its list
        // the same object, so the row is not re-rendered.
        const bitcoin = mockAccount({ symbol: 'btc' });
        const ethereum = mockAccount({ symbol: 'eth', index: 1 });
        const bitcoinKey = getAccountAssetKey({ deviceState: ALICE, symbol: 'btc' });

        const before = selectAccountsByAssetKey(createState([bitcoin, ethereum]), bitcoinKey);
        const after = selectAccountsByAssetKey(
            createState([bitcoin, { ...ethereum, formattedBalance: '2' }]),
            bitcoinKey,
        );

        expect(after).toBe(before);
    });

    it('follows an account whose token balance changed', () => {
        const before = mockAccount({ tokens: [{ contract: USDC_ON_ETH, balance: '100' }] });
        const after = { ...before, tokens: [{ ...before.tokens![0], balance: '150' }] } as Account;
        const usdcKey = getAccountAssetKey({
            deviceState: ALICE,
            symbol: 'eth',
            contractAddress: USDC_ON_ETH,
        });

        accountsIndex.read(createState([before]));

        expect(selectAccountsByAssetKey(createState([after]), usdcKey)).toEqual([after]);
    });
});
