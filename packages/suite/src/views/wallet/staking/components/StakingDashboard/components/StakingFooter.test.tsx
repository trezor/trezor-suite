import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkType } from '@suite-common/wallet-config';

import { useGuideOpenNode } from 'src/hooks/guide';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { StakingFooter } from './StakingFooter';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../mocks/mockInitialAppState';

jest.mock('src/hooks/guide', () => ({
    useGuideOpenNode: jest.fn(),
}));

const openNodeById = jest.fn();

const renderFooter = (networkType: NetworkType) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });

    return renderWithProviders(services, <StakingFooter networkType={networkType} />);
};

describe('StakingFooter', () => {
    beforeEach(() => {
        jest.mocked(useGuideOpenNode).mockReturnValue({ openNodeById });
    });

    it('credits the Tron providers instead of Everstake', () => {
        renderFooter('tron');

        expect(screen.getByText(/P2P\.org & Luganodes/)).toHaveTextContent(
            `${messages.TR_STAKE_PROVIDED_BY.defaultMessage} P2P.org & Luganodes`,
        );
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it.each<{ networkType: NetworkType; guide: string }>([
        { networkType: 'tron', guide: 'tron-trx-staking.md' },
        { networkType: 'ethereum', guide: 'ethereum-eth-staking.md' },
        { networkType: 'solana', guide: 'solana-sol-staking.md' },
        { networkType: 'cardano', guide: 'cardano-ada-staking.md' },
    ])('opens the $networkType staking guide', async ({ networkType, guide }) => {
        renderFooter(networkType);

        await userEvent.click(
            screen.getByRole('button', { name: messages.TR_LEARN_MORE.defaultMessage }),
        );

        expect(openNodeById).toHaveBeenCalledWith(`/earn/staking/${guide}`);
    });

    it.each<NetworkType>(['ethereum', 'solana', 'cardano'])(
        'keeps the Everstake attribution for %s',
        networkType => {
            renderFooter(networkType);

            expect(
                screen.getByText(messages.TR_STAKE_PROVIDED_BY.defaultMessage),
            ).toBeInTheDocument();
            expect(screen.getByRole('img')).toHaveAttribute(
                'src',
                expect.stringContaining('everstake'),
            );
            expect(screen.queryByText(/Luganodes/)).not.toBeInTheDocument();
        },
    );
});
