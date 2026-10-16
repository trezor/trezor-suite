import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { SpendingRestrictions } from './SpendingRestrictions';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const BTC = asNetworkSymbol('btc');
const ADDRESS = 'bc1privacy';

// The coinjoin backend branch of Account carries its own sync status, which the mock cannot express.
const privacyAccount: Extract<Account, { backendType: 'coinjoin' }> = {
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
    coordinatorUrl?: string;
    hasJointTransaction?: boolean;
};

const getInitialState = ({ coordinatorUrl, hasJointTransaction }: StateParams): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [privacyAccount],
        transactions: {
            ...mockInitialAppState.wallet.transactions,
            transactions: {
                [privacyAccount.key]: hasJointTransaction
                    ? [{ type: 'joint' } as WalletAccountTransaction]
                    : [],
            },
        },
        coinjoin: {
            ...mockInitialAppState.wallet.coinjoin,
            accounts: [{ key: privacyAccount.key, symbol: BTC, rawLiquidityClue: null }],
            debug: coordinatorUrl ? { coinjoinConfigOverride: { [BTC]: { coordinatorUrl } } } : {},
        },
    },
});

const renderSpendingRestrictions = (params: StateParams = {}) => {
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        services: () => ({ analytics: mockDesktopAnalytics() }),
        preloadedState: getInitialState(params),
    });

    renderWithProviders(services, <SpendingRestrictions account={privacyAccount} />);

    return screen.getByRole('switch');
};

describe('the spending restrictions switch of a Privacy account', () => {
    it('is off for a synced account that never took part in a coinjoin', () => {
        const toggle = renderSpendingRestrictions();

        expect(toggle).not.toBeChecked();
        expect(toggle).toBeEnabled();
    });

    it('is on for an account with a joint transaction', () => {
        const toggle = renderSpendingRestrictions({ hasJointTransaction: true });

        expect(toggle).toBeChecked();
        expect(toggle).toBeEnabled();
    });

    it('is forced on and read-only while mixing is enabled', () => {
        const toggle = renderSpendingRestrictions({
            coordinatorUrl: 'https://my-coordinator.example/wabisabi/',
        });

        expect(toggle).toBeChecked();
        expect(toggle).toBeDisabled();
    });
});
