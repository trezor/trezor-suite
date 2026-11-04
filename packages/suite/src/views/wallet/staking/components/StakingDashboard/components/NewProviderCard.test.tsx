import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import { StakeRegistrationDepositCard } from 'src/components/earn/modals/StakeModal/StakeForm/StakeRegistrationDepositCard';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { NewProviderCard } from './NewProviderCard';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';
import { CardanoNewProviderCard } from '../../AdaStakingDashboard/CardanoNewProviderCard';

const renderCard = (poolId: string | null, isActive = true, withVisibilityGate = false) => {
    const account: Account = {
        ...mockWalletAccount({ symbol: asNetworkSymbol('ada') }),
        ...networkSpecificDefaultCardano,
        misc: { staking: { ...networkSpecificDefaultCardano.misc.staking, poolId, isActive } },
    };
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: { ...mockInitialAppState.wallet, accounts: [account] },
        },
    });

    return renderWithProviders(
        services,
        withVisibilityGate ? (
            <CardanoNewProviderCard account={account} />
        ) : (
            <NewProviderCard account={account} />
        ),
    );
};

describe('NewProviderCard', () => {
    it('shows an informational provider update for a registered key without a pool', () => {
        renderCard(null);

        expect(screen.getByTestId('@staking/new-provider-card/header')).toHaveTextContent(
            messages.TR_STAKING_NO_POOL_TITLE.defaultMessage,
        );
        expect(screen.getByTestId('@staking/new-provider-card/paragraph')).toHaveTextContent(
            messages.TR_STAKING_NO_POOL_TEXT.defaultMessage,
        );
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button')).toHaveTextContent(
            messages.TR_EARN_UPDATE_PROVIDER.defaultMessage,
        );
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('adds an inline migration article link while retaining the single Update provider button', () => {
        renderCard(FIVE_BINARIES_POOLS[0] ?? null);

        const link = screen.getByRole('link', { name: messages.TR_LEARN_MORE.defaultMessage });
        const url = new URL(link.getAttribute('href') ?? '');
        expect(url.origin + url.pathname).toBe(
            'https://trezor.io/support/troubleshooting/coins-tokens/fix-cardano-staking-that-s-no-longer-earning-rewards',
        );
        expect(url.hash).toBe('');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(
            screen.getByTestId('@staking/new-provider-card/paragraph').parentElement,
        ).toContainElement(link);
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button')).toHaveTextContent(
            messages.TR_EARN_UPDATE_PROVIDER.defaultMessage,
        );
    });

    it('does not add the migration link for another staking provider', () => {
        renderCard('another-pool');

        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });
});

describe('Cardano provider update visibility', () => {
    it('offers Update provider for a registered key without a pool', () => {
        renderCard(null, true, true);

        expect(
            screen.getByTestId('@staking/new-provider-card/update-provider-button'),
        ).toBeVisible();
    });

    it('does not offer a provider update before stake key registration', () => {
        renderCard(null, false, true);

        expect(
            screen.queryByTestId('@staking/new-provider-card/update-provider-button'),
        ).toBeNull();
    });
});

it('reuses a registered stake key without quoting another registration deposit', () => {
    const account = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: { ...mockInitialAppState.wallet, accounts: [account] },
        },
    });
    renderWithProviders(services, <StakeRegistrationDepositCard account={account} />);

    expect(screen.getByTestId('@modal/staking/new-provider')).toHaveTextContent('Everstake');
    expect(
        screen.queryByTestId('@modal/staking/registration-deposit-amount-with-symbol'),
    ).toBeNull();
});
