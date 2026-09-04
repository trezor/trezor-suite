import { type CryptoId } from 'invity-api';

import {
    type Account,
    type RatesByKey,
    asAccountDescriptor,
    asBaseCurrencyAmount,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { asNetworkSymbol } from '@trezor/network-module';
import { BigNumber } from '@trezor/utils';

import { createAccountOption, createTokenOption } from 'src/components/suite/asset-picker/utils';
import { getAssetGroupKey } from 'src/components/suite/asset-picker/utils/assetGroupKey';
import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { buildGroupedAssetOptions } from './buildGroupedAssetOptions';

const ETH_CRYPTO_ID = 'ethereum' as CryptoId;
const ethSymbol = asNetworkSymbol('eth');
const USDT_CONTRACT = toTokenAddress('0xdac17f958d2ee523a2206206994597c13d831ec7');
const USDT_CRYPTO_ID = `ethereum--${USDT_CONTRACT}` as CryptoId;

const createEthAccount = (descriptor: string, formattedBalance: string): Account =>
    mockWalletAccount({
        symbol: ethSymbol,
        descriptor: asAccountDescriptor(descriptor),
        balance: formattedBalance,
        formattedBalance,
    });

const createToken = (token: Partial<TokensWithRates> = {}): TokensWithRates => ({
    ...mockAccountToken({
        name: 'Tether',
        symbol: 'USDT',
        contract: USDT_CONTRACT,
        balance: '20',
    }),
    fiatValue: new BigNumber('20'),
    fiatRate: {
        rate: 1,
        lastTickerTimestamp: asTimestamp(1_000_000),
        lastSuccessfulFetchTimestamp: asTimestamp(1_000_000),
        isLoading: false,
        error: null,
        ticker: { symbol: ethSymbol },
    },
    ...token,
});

const ethRates: RatesByKey = {
    [getFiatRateKey(ethSymbol, 'usd')]: {
        rate: 2_000,
        lastTickerTimestamp: asTimestamp(1_000_000),
        lastSuccessfulFetchTimestamp: asTimestamp(1_000_000),
        isLoading: false,
        error: null,
        ticker: { symbol: ethSymbol },
    },
};

const threshold = asBaseCurrencyAmount(new BigNumber('0.1'));

const buildOptions = ({
    assetRows,
    tradableCryptoIds = new Set([ETH_CRYPTO_ID, USDT_CRYPTO_ID]),
    expandedGroupKeys = [],
    fiatRates = ethRates,
}: Partial<Parameters<typeof buildGroupedAssetOptions>[0]>) =>
    buildGroupedAssetOptions({
        assetRows: assetRows ?? [],
        tradableCryptoIds,
        threshold,
        fiatRates,
        baseCurrencyCode: 'usd',
        expandedGroupKeys,
    });

describe('buildGroupedAssetOptions', () => {
    it('keeps a tradable account and its tradable token in the regular list', () => {
        const account = createEthAccount('richEthAccount', '1');
        const assetRows = [createAccountOption(account), createTokenOption(account, createToken())];

        expect(buildOptions({ assetRows })).toEqual(assetRows);
    });

    it('moves a dust native coin into the low-balance group', () => {
        const account = createEthAccount('dustEthAccount', '0.00000001');
        const accountRow = createAccountOption(account);
        const tokenRow = createTokenOption(account, createToken());

        expect(buildOptions({ assetRows: [accountRow, tokenRow] })).toEqual([
            tokenRow,
            {
                type: 'asset-groups',
                account,
                groups: [
                    {
                        type: 'low-balance-group',
                        items: [accountRow],
                        expanded: false,
                    },
                ],
            },
        ]);
    });

    it('moves a non-sellable native coin into the non-tradable group regardless of its balance', () => {
        const account = createEthAccount('richEthAccount', '1');
        const accountRow = createAccountOption(account);

        expect(
            buildOptions({
                assetRows: [accountRow],
                tradableCryptoIds: new Set([USDT_CRYPTO_ID]),
            }),
        ).toEqual([
            {
                type: 'asset-groups',
                account,
                groups: [
                    {
                        type: 'non-tradable-group',
                        items: [accountRow],
                        expanded: false,
                    },
                ],
            },
        ]);
    });

    it('keeps a token without a fiat rate in the regular list', () => {
        const account = createEthAccount('richEthAccount', '1');
        const tokenRow = createTokenOption(
            account,
            createToken({ fiatRate: undefined, fiatValue: new BigNumber('0') }),
        );

        expect(buildOptions({ assetRows: [tokenRow] })).toEqual([tokenRow]);
    });

    it('keeps a native coin without a fiat rate in the regular list', () => {
        const account = createEthAccount('dustEthAccount', '0.00000001');
        const accountRow = createAccountOption(account);

        expect(buildOptions({ assetRows: [accountRow], fiatRates: {} })).toEqual([accountRow]);
    });

    it('puts both groups of an account holding only dust and non-sellable assets in one card', () => {
        const account = createEthAccount('dustEthAccount', '0.00000001');
        const accountRow = createAccountOption(account);
        const nonTradableTokenRow = createTokenOption(account, createToken());

        expect(
            buildOptions({
                assetRows: [accountRow, nonTradableTokenRow],
                tradableCryptoIds: new Set([ETH_CRYPTO_ID]),
            }),
        ).toEqual([
            {
                type: 'asset-groups',
                account,
                groups: [
                    {
                        type: 'low-balance-group',
                        items: [accountRow],
                        expanded: false,
                    },
                    {
                        type: 'non-tradable-group',
                        items: [nonTradableTokenRow],
                        expanded: false,
                    },
                ],
            },
        ]);
    });

    it('expands only the group whose key is expanded', () => {
        const account = createEthAccount('dustEthAccount', '0.00000001');
        const accountRow = createAccountOption(account);
        const nonTradableTokenRow = createTokenOption(account, createToken());

        const options = buildOptions({
            assetRows: [accountRow, nonTradableTokenRow],
            tradableCryptoIds: new Set([ETH_CRYPTO_ID]),
            expandedGroupKeys: [getAssetGroupKey(account.key, 'low-balance-group')],
        });

        expect(options).toEqual([
            expect.objectContaining({
                type: 'asset-groups',
                groups: [
                    expect.objectContaining({
                        type: 'low-balance-group',
                        expanded: true,
                    }),
                    expect.objectContaining({
                        type: 'non-tradable-group',
                        expanded: false,
                    }),
                ],
            }),
        ]);
    });

    it('groups each account separately and keeps the incoming account order', () => {
        const firstAccount = createEthAccount('firstEthAccount', '1');
        const secondAccount = createEthAccount('secondEthAccount', '0.00000001');
        const firstAccountRow = createAccountOption(firstAccount);
        const secondAccountRow = createAccountOption(secondAccount);

        expect(buildOptions({ assetRows: [firstAccountRow, secondAccountRow] })).toEqual([
            firstAccountRow,
            {
                type: 'asset-groups',
                account: secondAccount,
                groups: [
                    expect.objectContaining({
                        type: 'low-balance-group',
                        items: [secondAccountRow],
                    }),
                ],
            },
        ]);
    });
});
