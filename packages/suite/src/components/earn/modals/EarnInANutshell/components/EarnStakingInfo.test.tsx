import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { EarnStakingInfo } from './EarnStakingInfo';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

describe('Cardano provider update information', () => {
    it.each([undefined, CARDANO_EVERSTAKE_STAKING_POOL.bech32])(
        'only describes continuing rewards when the account has a pool (%s)',
        poolId => {
            const account = mockWalletAccount(
                { symbol: asNetworkSymbol('ada') },
                { misc: { staking: { isActive: true, poolId } } },
            );
            const { services } = createTestCompositionRoot<void, MockSuiteState>({
                preloadedState: mockInitialAppState,
            });
            renderWithProviders(
                services,
                <EarnStakingInfo account={account} flow={EarnFlow.UpdateProvider} />,
            );

            const continuingRewards =
                messages.TR_EARN_KEEP_EARNING_REWARDS_WITH_CURRENT_PROVIDER.defaultMessage;
            if (poolId) {
                expect(screen.getByText(continuingRewards)).toBeVisible();
            } else {
                expect(screen.queryByText(continuingRewards)).toBeNull();
                expect(
                    screen.getByText(messages.TR_EARN_ENTER_ACTIVATION_PERIOD.defaultMessage),
                ).toBeVisible();
            }
        },
    );
});
