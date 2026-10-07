import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';

const stellarAccount = mockWalletAccount({
    symbol: asNetworkSymbol('xlm'),
    descriptor: asAccountDescriptor('GADDRESS'),
});
const failedAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') }, undefined, {
    failed: true,
    error: 'discovery failed',
});

const renderAccounts = (accounts: Parameters<typeof useLegacyPortfolioAccounts>[0]) => {
    const store = configureStore({
        reducer: {
            wallet: () => ({ stellarContractTokens: { [stellarAccount.key]: ['CWATCHED'] } }),
        },
    });

    return renderHook(() => useLegacyPortfolioAccounts(accounts), {
        wrapper: ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>,
    });
};

describe(useLegacyPortfolioAccounts.name, () => {
    it('watches the contracts the user added to the account', () => {
        const { result } = renderAccounts([stellarAccount]);

        expect(result.current.accounts[0]?.chainAccounts[0]?.watchedTokens).toEqual(['CWATCHED']);
        expect(result.current.hasUnreadableAccount).toBe(false);
    });

    it('reports accounts not read from a chain backend', () => {
        const { result } = renderAccounts([stellarAccount, failedAccount]);

        expect(result.current.accounts).toHaveLength(1);
        expect(result.current.hasUnreadableAccount).toBe(true);
    });
});
