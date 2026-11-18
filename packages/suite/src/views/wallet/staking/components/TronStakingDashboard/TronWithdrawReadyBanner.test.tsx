import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { events } from '@suite/analytics';
import { messages } from '@suite/intl';
import { type StakingPositionUnlock } from '@suite-common/earn-staking-common';
import { type VersionArray } from '@trezor/utils';

import { TronWithdrawReadyBanner } from './TronWithdrawReadyBanner';
import {
    TRON_DETAILS,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
    trxAccount,
    trxProduct,
} from '../stakingDashboardTestState';

const TRX = 1_000_000;
const HOUR_MS = 60 * 60 * 1000;
const NOW_MS = 1_700_000_000_000;

const sun = (value: number) => amount(String(value));

type RenderParams = {
    withdrawable?: number;
    unlocks?: StakingPositionUnlock[];
    disabledFeatures?: readonly string[];
    firmware?: VersionArray;
};

const renderBanner = ({
    withdrawable = 0,
    unlocks = [],
    disabledFeatures,
    firmware,
}: RenderParams = {}) =>
    renderStakingDashboardComponent(
        <TronWithdrawReadyBanner account={trxAccount} nowMs={NOW_MS} />,
        {
            state: createStakingDashboardState({
                accounts: [trxAccount],
                positions: {
                    [trxAccount.key]: [
                        mockPosition(trxProduct.id, {
                            balances: {
                                staked: sun(100 * TRX),
                                pending: sun(0),
                                unstaking: amount(
                                    String(
                                        unlocks.reduce(
                                            (sum, unlock) => sum + Number(unlock.amount),
                                            0,
                                        ),
                                    ),
                                ),
                                withdrawable: sun(withdrawable),
                                rewards: sun(0),
                            },
                            unlocks,
                            operations:
                                withdrawable > 0
                                    ? ['stake', 'unstake', 'withdraw']
                                    : ['stake', 'unstake'],
                            details: TRON_DETAILS,
                        }),
                    ],
                },
                disabledFeatures,
                firmware,
            }),
        },
    );

describe('TronWithdrawReadyBanner', () => {
    it('renders nothing while nothing is withdrawable', () => {
        renderBanner({ unlocks: [{ amount: sun(10 * TRX), availableAt: NOW_MS + HOUR_MS }] });

        expect(
            screen.queryByTestId('@staking/tron-withdraw-banner/container'),
        ).not.toBeInTheDocument();
    });

    it('counts an unlock whose time has passed with the withdrawable amount', async () => {
        const { report } = renderBanner({
            withdrawable: 5 * TRX,
            unlocks: [{ amount: sun(10 * TRX), availableAt: NOW_MS - 60_000 }],
        });

        expect(screen.getByTestId('@staking/tron-withdraw-banner/description')).toHaveTextContent(
            '15 TRX',
        );

        const withdrawButton = screen.getByTestId('@staking/tron-withdraw-banner/withdraw-button');
        expect(withdrawButton).toBeEnabled();

        await userEvent.click(withdrawButton);

        expect(report).toHaveBeenCalledWith({
            type: events.stakingUnstakeEvent.name,
            payload: { action: 'continue', step: 'staking-dashboard', networkSymbol: 'trx' },
        });
    });

    it('disables the withdrawal when the message system switches it off', () => {
        renderBanner({ withdrawable: 5 * TRX, disabledFeatures: ['trx.staking.withdraw'] });

        expect(screen.getByTestId('@staking/tron-withdraw-banner/withdraw-button')).toBeDisabled();
    });

    it('asks for a firmware update below the minimum firmware instead of opening the flow', async () => {
        const { report } = renderBanner({ withdrawable: 5 * TRX, firmware: [2, 12, 1] });

        const withdrawButton = screen.getByTestId('@staking/tron-withdraw-banner/withdraw-button');
        expect(withdrawButton).toBeEnabled();

        await userEvent.click(withdrawButton);

        expect(
            screen.getByText(
                messages.TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING.defaultMessage,
            ),
        ).toBeInTheDocument();
        expect(report).not.toHaveBeenCalled();
    });
});
