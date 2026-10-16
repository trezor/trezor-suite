import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { SpendingRestrictionsBanner } from './SpendingRestrictionsBanner';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const BTC = asNetworkSymbol('btc');
const ADDRESS = 'bc1privacy';

// The coinjoin backend branch of Account carries its own sync status, which the mock cannot express.
const privacyAccount: Account = {
    ...mockWalletAccount({
        symbol: BTC,
        accountType: 'coinjoin',
        path: "m/10025'/0'/0'/1'",
    }),
    backendType: 'coinjoin',
    status: 'ready',
    addresses: { change: [], used: [], unused: [], anonymitySet: { [ADDRESS]: 1 } },
    utxo: [{ address: ADDRESS } as NonNullable<Account['utxo']>[number]],
};

type StateParams = {
    hasAnonymityScores?: boolean;
    hasJointTransaction?: boolean;
};

const getInitialState = ({
    hasAnonymityScores = true,
    hasJointTransaction,
}: StateParams): AppState => {
    const account: Account = hasAnonymityScores
        ? privacyAccount
        : { ...privacyAccount, addresses: { change: [], used: [], unused: [] } };

    return {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            accounts: [account],
            transactions: {
                ...mockInitialAppState.wallet.transactions,
                transactions: {
                    [account.key]: hasJointTransaction
                        ? [{ type: 'joint' } as WalletAccountTransaction]
                        : [],
                },
            },
            coinjoin: {
                ...mockInitialAppState.wallet.coinjoin,
                accounts: [{ key: account.key, symbol: BTC, rawLiquidityClue: null }],
            },
        },
    };
};

const renderBanner = (params: StateParams = {}) => {
    const { services } = createTestCompositionRoot<object, AppState>({
        preloadedState: getInitialState(params),
    });

    renderWithProviders(services, <SpendingRestrictionsBanner account={privacyAccount} />);
};

describe('the explanatory banner of a restricted Privacy account', () => {
    it('is absent for an account that never took part in a coinjoin', () => {
        renderBanner();

        expect(
            screen.queryByTestId('@wallet/privacy-account/restrictions-banner'),
        ).not.toBeInTheDocument();
    });

    it('explains the coins set aside on an account with a joint transaction', () => {
        renderBanner({ hasJointTransaction: true });

        expect(
            screen.getByTestId('@wallet/privacy-account/restrictions-banner'),
        ).toBeInTheDocument();
    });

    it('is absent without anonymity scores, where the send form explains what failed', () => {
        renderBanner({ hasAnonymityScores: false, hasJointTransaction: true });

        expect(
            screen.queryByTestId('@wallet/privacy-account/restrictions-banner'),
        ).not.toBeInTheDocument();
    });
});
