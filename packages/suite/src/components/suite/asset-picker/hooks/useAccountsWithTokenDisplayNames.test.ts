import { renderHook } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import {
    type TradingAssetOption,
    type TradingAssetOptionWithContractAddress,
} from '@suite-common/trading';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { type AccountWithTokensOption } from '../types';
import {
    getAccountsWithTokenDisplayNames,
    getTokenDisplayNameSources,
    useAccountsWithTokenDisplayNames,
} from './useAccountsWithTokenDisplayNames';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useTradingAssets: () => ({
        buildAssetOptions: jest.fn(() => ({ assets: [] })),
    }),
}));

const ethSymbol = asNetworkSymbol('eth');
const polSymbol = asNetworkSymbol('pol');

const createAccount = (symbol: NetworkSymbol): AccountWithSuiteSyncLabel =>
    ({
        symbol,
        label: null,
    }) as AccountWithSuiteSyncLabel;

const createToken = (contract: string, name: string): TokensWithRates =>
    ({
        contract,
        name,
        standard: 'ERC20',
        decimals: 18,
        fiatValue: new BigNumber(0),
    }) as TokensWithRates;

const createAsset = (
    overrides: Partial<TradingAssetOptionWithContractAddress> &
        Pick<TradingAssetOptionWithContractAddress, 'id'>,
): TradingAssetOption => {
    const { id, ...assetOverrides } = overrides;

    return {
        id,
        coingeckoId: 'ethereum' as CryptoId,
        isNativeToken: false,
        name: 'Asset Name',
        symbol: 'asset',
        displaySymbol: 'ASSET',
        contractAddress: '0x1',
        networkName: 'Ethereum',
        networkSymbol: ethSymbol,
        ...assetOverrides,
    };
};

describe('useAccountsWithTokenDisplayNames', () => {
    const ethereumAccount = createAccount(ethSymbol);
    const polygonAccount = createAccount(polSymbol);

    const accountOption: AccountWithTokensOption = {
        type: 'account',
        account: ethereumAccount,
    };
    const token = createToken('0x1', 'Discovered One');
    const hiddenToken = createToken('0x2', 'Discovered Two');
    const unknownNameToken = createToken('0x3', 'Discovered Three');

    const accountsWithTokens: AccountWithTokensOption[] = [
        accountOption,
        {
            type: 'token',
            account: ethereumAccount,
            token,
        },
        {
            type: 'hidden-tokens',
            account: ethereumAccount,
            tokens: [hiddenToken],
            expanded: true,
        },
        {
            type: 'hidden-tokens',
            account: polygonAccount,
            tokens: [unknownNameToken],
            expanded: false,
        },
    ];

    it('collects token display name sources from all token option types', () => {
        expect(getTokenDisplayNameSources(accountsWithTokens)).toEqual([
            { account: ethereumAccount, token },
            { account: ethereumAccount, token: hiddenToken },
            { account: polygonAccount, token: unknownNameToken },
        ]);
    });

    it('returns accounts with canonical token display names', () => {
        const accountsWithDisplayNames = getAccountsWithTokenDisplayNames(
            accountsWithTokens,
            new Map<CryptoId, string>([
                ['ethereum--0x1' as CryptoId, 'Canonical One'],
                ['ethereum--0x2' as CryptoId, 'Canonical Two'],
            ]),
        );

        expect(accountsWithDisplayNames[0]).toBe(accountOption);
        expect(accountsWithDisplayNames[1]).toMatchObject({
            type: 'token',
            token: { name: 'Canonical One' },
        });
        expect(accountsWithDisplayNames[2]).toMatchObject({
            type: 'hidden-tokens',
            tokens: [{ name: 'Canonical Two' }],
        });
        expect(accountsWithDisplayNames[3]).toMatchObject({
            type: 'hidden-tokens',
            tokens: [{ name: 'Discovered Three' }],
        });
    });

    it('returns accounts with token display names from the hook', () => {
        const { result } = renderHook(() =>
            useAccountsWithTokenDisplayNames(accountsWithTokens, [
                createAsset({
                    id: 'ethereum--0x1' as CryptoId,
                    displaySymbolName: 'Canonical One',
                }),
                createAsset({
                    id: 'ethereum--0x2' as CryptoId,
                    displaySymbolName: 'Canonical Two',
                }),
            ]),
        );

        expect(result.current[1]).toMatchObject({
            type: 'token',
            token: { name: 'Canonical One' },
        });
        expect(result.current[2]).toMatchObject({
            type: 'hidden-tokens',
            tokens: [{ name: 'Canonical Two' }],
        });
        expect(result.current[3]).toMatchObject({
            type: 'hidden-tokens',
            tokens: [{ name: 'Discovered Three' }],
        });
    });
});
