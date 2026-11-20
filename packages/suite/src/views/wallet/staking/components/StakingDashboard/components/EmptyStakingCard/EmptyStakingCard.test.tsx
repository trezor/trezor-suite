import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { events } from '@suite/analytics';
import { messages } from '@suite/intl';
import { type VersionArray } from '@trezor/utils';

import { EmptyStakingCard } from './EmptyStakingCard';
import {
    createStakingDashboardState,
    renderStakingDashboardComponent,
    trxAccount,
} from '../../../stakingDashboardTestState';

const START_STAKING_BUTTON = '@wallet/staking/empty-card/start-staking-button';

const renderCard = (firmware?: VersionArray) =>
    renderStakingDashboardComponent(<EmptyStakingCard account={trxAccount} />, {
        state: createStakingDashboardState({ accounts: [trxAccount], firmware }),
    });

describe('EmptyStakingCard', () => {
    it('opens the Tron stake flow from the minimum firmware', async () => {
        const { report } = renderCard();

        await userEvent.click(screen.getByTestId(START_STAKING_BUTTON));

        expect(report).toHaveBeenCalledWith({
            type: events.stakingStakeEvent.name,
            payload: { action: 'continue', step: 'staking-dashboard', networkSymbol: 'trx' },
        });
        expect(
            screen.queryByText(
                messages.TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING.defaultMessage,
            ),
        ).not.toBeInTheDocument();
    });

    it('asks for a firmware update below the minimum firmware instead of opening the flow', async () => {
        const { report } = renderCard([2, 12, 1]);

        const startStakingButton = screen.getByTestId(START_STAKING_BUTTON);
        expect(startStakingButton).toBeEnabled();

        await userEvent.click(startStakingButton);

        expect(
            screen.getByText(
                messages.TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING.defaultMessage,
            ),
        ).toBeInTheDocument();
        expect(report).not.toHaveBeenCalled();
    });
});
