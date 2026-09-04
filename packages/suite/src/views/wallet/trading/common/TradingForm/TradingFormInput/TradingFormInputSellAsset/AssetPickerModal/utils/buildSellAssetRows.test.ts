import { type CryptoId } from 'invity-api';

import { DefinitionType, type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type RatesByKey,
    asAccountDescriptor,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { buildSellAssetRows } from './buildSellAssetRows';

const USDT_CONTRACT = toTokenAddress('0xdac17f958d2ee523a2206206994597c13d831ec7');
const USDC_CONTRACT = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const SHIB_CONTRACT = toTokenAddress('0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce');
const FAKE_CONTRACT = toTokenAddress('0x1111111111111111111111111111111111111111');

const ETH_CRYPTO_ID = 'ethereum' as CryptoId;
const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');
const tsepSymbol = asNetworkSymbol('tsep');
const USDT_CRYPTO_ID = `ethereum--${USDT_CONTRACT}` as CryptoId;

const createToken = (contract: string, symbol: string, balance: string) =>
    mockAccountToken({ name: symbol, symbol, contract: toTokenAddress(contract), balance });

const createAccount = ({
    symbol = ethSymbol,
    descriptor,
    balance = '0',
    accountType = 'normal',
    tokens = [],
}: {
    symbol?: NetworkSymbol;
    descriptor: string;
    balance?: string;
    accountType?: Account['accountType'];
    tokens?: Account['tokens'];
}): Account =>
    mockWalletAccount({
        symbol,
        descriptor: asAccountDescriptor(descriptor),
        balance,
        formattedBalance: balance,
        accountType,
        tokens,
    });

const createRate = (rate: number) => ({
    rate,
    lastTickerTimestamp: asTimestamp(1_000_000),
    lastSuccessfulFetchTimestamp: asTimestamp(1_000_000),
    isLoading: false,
    error: null,
    ticker: { symbol: ethSymbol },
});

const fiatRates: RatesByKey = {
    [getFiatRateKey(ethSymbol, 'usd')]: createRate(2_000),
    [getFiatRateKey(ethSymbol, 'usd', USDT_CONTRACT)]: createRate(1),
    [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT)]: createRate(1),
    [getFiatRateKey(ethSymbol, 'usd', SHIB_CONTRACT)]: createRate(0.00001),
    [getFiatRateKey(ethSymbol, 'usd', FAKE_CONTRACT)]: createRate(1),
};

const tokenDefinitions: TokenDefinitionsState = {
    [ethSymbol]: {
        [DefinitionType.COIN]: {
            error: false,
            isLoading: false,
            data: [USDT_CONTRACT, USDC_CONTRACT, SHIB_CONTRACT],
            hide: [USDC_CONTRACT],
            show: [],
        },
    },
};

const buildRows = ({
    accounts,
    networkSymbolFilter,
    excludedCryptoIds = new Set<CryptoId>(),
}: {
    accounts: Account[];
    networkSymbolFilter?: NetworkSymbol;
    excludedCryptoIds?: Set<CryptoId>;
}) =>
    buildSellAssetRows({
        accounts,
        networkSymbolFilter,
        excludedCryptoIds,
        tokenDefinitions,
        baseCurrencyCode: 'usd',
        fiatRates,
    });

describe('buildSellAssetRows', () => {
    it('drops testnet and coinjoin accounts', () => {
        const testnetAccount = createAccount({
            symbol: tsepSymbol,
            descriptor: 'testnetAccount',
            balance: '1',
        });
        const coinjoinAccount = createAccount({
            symbol: btcSymbol,
            descriptor: 'coinjoinAccount',
            balance: '1',
            accountType: 'coinjoin',
        });

        expect(buildRows({ accounts: [testnetAccount, coinjoinAccount] })).toEqual({
            assetRows: [],
            networks: [],
        });
    });

    it('drops an account with neither a coin balance nor a token balance', () => {
        const emptyAccount = createAccount({ descriptor: 'emptyAccount' });
        const zeroTokenAccount = createAccount({
            descriptor: 'zeroTokenAccount',
            tokens: [createToken(USDT_CONTRACT, 'USDT', '0')],
        });

        expect(buildRows({ accounts: [emptyAccount, zeroTokenAccount] })).toEqual({
            assetRows: [],
            networks: [],
        });
    });

    it('keeps an account alive for its token alone, without emitting a coin row', () => {
        const account = createAccount({
            descriptor: 'tokenOnlyAccount',
            tokens: [createToken(USDT_CONTRACT, 'USDT', '20')],
        });

        const { assetRows, networks } = buildRows({ accounts: [account] });

        expect(assetRows).toEqual([expect.objectContaining({ type: 'token', account })]);
        expect(networks).toEqual(['eth']);
    });

    it('emits the coin row first, then tokens by descending fiat value', () => {
        const account = createAccount({
            descriptor: 'richAccount',
            balance: '1',
            tokens: [
                createToken(SHIB_CONTRACT, 'SHIB', '1000'),
                createToken(USDT_CONTRACT, 'USDT', '20'),
            ],
        });

        expect(buildRows({ accounts: [account] }).assetRows).toEqual([
            expect.objectContaining({ type: 'account' }),
            expect.objectContaining({
                type: 'token',
                token: expect.objectContaining({ symbol: 'USDT' }),
            }),
            expect.objectContaining({
                type: 'token',
                token: expect.objectContaining({ symbol: 'SHIB' }),
            }),
        ]);
    });

    it('hides the rows of excluded crypto ids but keeps the account listed', () => {
        const account = createAccount({
            descriptor: 'richAccount',
            balance: '1',
            tokens: [
                createToken(USDT_CONTRACT, 'USDT', '20'),
                createToken(SHIB_CONTRACT, 'SHIB', '1000'),
            ],
        });

        const { assetRows, networks } = buildRows({
            accounts: [account],
            excludedCryptoIds: new Set([ETH_CRYPTO_ID, USDT_CRYPTO_ID]),
        });

        expect(assetRows).toEqual([
            expect.objectContaining({
                type: 'token',
                token: expect.objectContaining({ symbol: 'SHIB' }),
            }),
        ]);
        expect(networks).toEqual(['eth']);
    });

    it('includes a hidden token with a balance and skips an unverified one', () => {
        const account = createAccount({
            descriptor: 'mixedTokensAccount',
            tokens: [
                createToken(USDC_CONTRACT, 'USDC', '20'),
                createToken(FAKE_CONTRACT, 'FAKE', '1000'),
            ],
        });

        expect(buildRows({ accounts: [account] }).assetRows).toEqual([
            expect.objectContaining({
                type: 'token',
                token: expect.objectContaining({ symbol: 'USDC' }),
            }),
        ]);
    });

    it('lists every valid account network in collection order, ignoring the network filter', () => {
        const ethAccount = createAccount({ descriptor: 'ethAccount', balance: '1' });
        const btcAccount = createAccount({
            symbol: btcSymbol,
            descriptor: 'btcAccount',
            balance: '1',
        });

        const { assetRows, networks } = buildRows({
            accounts: [ethAccount, btcAccount],
            networkSymbolFilter: ethSymbol,
        });

        expect(networks).toEqual(['btc', 'eth']);
        expect(assetRows).toEqual([
            expect.objectContaining({ type: 'account', account: ethAccount }),
        ]);
    });
});
