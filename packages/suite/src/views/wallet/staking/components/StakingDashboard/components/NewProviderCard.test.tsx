import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { NewProviderCard } from './NewProviderCard';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const renderCard = (poolId: string | null) => {
    const account: Account = {
        ...mockWalletAccount({ symbol: asNetworkSymbol('ada') }),
        ...networkSpecificDefaultCardano,
        misc: { staking: { ...networkSpecificDefaultCardano.misc.staking, poolId } },
    };
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    return renderWithProviders(services, <NewProviderCard account={account} />);
};

describe('NewProviderCard', () => {
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
