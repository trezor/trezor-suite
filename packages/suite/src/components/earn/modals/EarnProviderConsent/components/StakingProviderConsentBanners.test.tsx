import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { FIVE_BINARIES_POOLS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getIndexOrThrow } from '@trezor/utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { StakingProviderConsentBanners } from './StakingProviderConsentBanners';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const renderBanners = (account: Account, flow: EarnFlow) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            networks: mockNetworksState([asNetworkSymbol('ada')]),
        },
    });

    renderWithProviders(services, <StakingProviderConsentBanners account={account} flow={flow} />);
};

const cardanoAccount = (poolId: string | null, isActive = true) =>
    mockWalletAccount(
        { symbol: asNetworkSymbol('ada') },
        { misc: { staking: { poolId, isActive, drep: { drep_id: 'drep_always_abstain' } } } },
    );

describe('Cardano consent voting defaults', () => {
    it.each([
        {
            name: 'new stake defaults to Abstain',
            flow: EarnFlow.Stake,
            account: cardanoAccount(null, false),
            message: 'TR_EARN_CARDANO_STAKE_STAYS_IN_WALLET',
        },
        {
            name: 'Five Binaries migration resets to Abstain',
            flow: EarnFlow.UpdateProvider,
            account: cardanoAccount(getIndexOrThrow(FIVE_BINARIES_POOLS, 0)),
            message: 'TR_EARN_CARDANO_UPDATE_ABSTAIN',
        },
        {
            name: 'other pool migration keeps the live voting preference',
            flow: EarnFlow.UpdateProvider,
            account: cardanoAccount('another-pool'),
            message: 'TR_EARN_CARDANO_UPDATE_KEEP_CURRENT_VOTE',
        },
        {
            name: 'migration without a live delegation defaults to Abstain',
            flow: EarnFlow.UpdateProvider,
            account: cardanoAccount('another-pool', false),
            message: 'TR_EARN_CARDANO_UPDATE_ABSTAIN',
        },
    ] as const)('$name', ({ flow, account, message }) => {
        renderBanners(account, flow);

        expect(
            screen.getByText(messages[message].defaultMessage.replace('{symbol}', 'ADA')),
        ).toBeVisible();
        const otherMessages = [
            'TR_EARN_CARDANO_STAKE_STAYS_IN_WALLET',
            'TR_EARN_CARDANO_UPDATE_ABSTAIN',
            'TR_EARN_CARDANO_UPDATE_KEEP_CURRENT_VOTE',
        ] as const;
        otherMessages
            .filter(id => id !== message)
            .forEach(id => {
                expect(
                    screen.queryByText(messages[id].defaultMessage.replace('{symbol}', 'ADA')),
                ).toBeNull();
            });
    });
});
