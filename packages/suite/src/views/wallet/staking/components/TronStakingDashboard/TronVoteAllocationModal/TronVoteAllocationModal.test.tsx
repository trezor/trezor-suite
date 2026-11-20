import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { messages } from '@suite/intl';
import { type VersionArray } from '@trezor/utils';

import { TronVoteAllocationModal } from './TronVoteAllocationModal';
import {
    TRON_DETAILS,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
    trxAccount,
    trxProduct,
} from '../../stakingDashboardTestState';

const DIALOG = '@modal/tron-vote-allocation';
const VOTE_BUTTON = '@modal/tron-vote-allocation/vote-button';

const firmwarePromptHeading = () =>
    screen.queryByText(messages.TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING.defaultMessage);

const renderDialog = (firmware?: VersionArray) => {
    const onClose = jest.fn();

    renderStakingDashboardComponent(
        <TronVoteAllocationModal account={trxAccount} onClose={onClose} />,
        {
            state: createStakingDashboardState({
                accounts: [trxAccount],
                positions: {
                    [trxAccount.key]: [
                        mockPosition(trxProduct.id, {
                            balances: {
                                staked: amount('100000000'),
                                pending: amount('0'),
                                unstaking: amount('0'),
                                withdrawable: amount('0'),
                                rewards: amount('0'),
                            },
                            operations: ['stake', 'unstake', 'vote'],
                            details: {
                                ...TRON_DETAILS,
                                votingPower: amount('100000000'),
                                unallocatedVotingPower: amount('100000000'),
                            },
                        }),
                    ],
                },
                firmware,
            }),
        },
    );

    return { onClose };
};

describe('TronVoteAllocationModal', () => {
    it('closes on Escape', async () => {
        const { onClose } = renderDialog();

        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays open while Escape closes the firmware prompt it opened', async () => {
        const { onClose } = renderDialog([2, 12, 1]);

        await userEvent.click(screen.getByTestId(VOTE_BUTTON));
        expect(firmwarePromptHeading()).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(firmwarePromptHeading()).not.toBeInTheDocument();
        expect(screen.getByTestId(DIALOG)).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });
});
