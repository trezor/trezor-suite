import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { messages } from '@suite/intl';
import { type VersionArray } from '@trezor/utils';

import { TronResourceModal } from './TronResourceModal';
import {
    TRON_DETAILS,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
    trxAccount,
    trxProduct,
} from '../stakingDashboardTestState';

const DIALOG = '@modal/tron-resource';
const GET_MORE_BUTTON = '@modal/tron-resource/get-more-button';

const firmwarePromptHeading = () =>
    screen.queryByText(messages.TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING.defaultMessage);

const renderDialog = (firmware?: VersionArray) => {
    const onClose = jest.fn();

    renderStakingDashboardComponent(
        <TronResourceModal account={trxAccount} resourceType="energy" onClose={onClose} />,
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
                            details: TRON_DETAILS,
                        }),
                    ],
                },
                firmware,
            }),
        },
    );

    return { onClose };
};

describe('TronResourceModal', () => {
    it('closes on Escape', async () => {
        const { onClose } = renderDialog();

        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays open while Escape closes the firmware prompt it opened', async () => {
        const { onClose } = renderDialog([2, 12, 1]);

        await userEvent.click(screen.getByTestId(GET_MORE_BUTTON));
        expect(firmwarePromptHeading()).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(firmwarePromptHeading()).not.toBeInTheDocument();
        expect(screen.getByTestId(DIALOG)).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });
});
