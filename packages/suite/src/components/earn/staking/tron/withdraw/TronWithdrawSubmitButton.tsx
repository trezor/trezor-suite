import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { getTronWithdrawableBalance } from '@suite-common/wallet-utils';
import { Button, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';

export const TronWithdrawSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;

    const { isWithdrawingDisabled, withdrawingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    const hasWithdrawableAmount = new BigNumber(getTronWithdrawableBalance(account)).gt(0);
    const isDeviceUnavailable = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        if (isWithdrawingDisabled) {
            return;
        }

        submitAction();

        if (!device?.connected || !device?.available) {
            return;
        }

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                step: 'withdraw-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Tooltip content={withdrawingMessageContent}>
            <Button
                size="large"
                width="100%"
                onClick={handleClick}
                isDisabled={
                    isWithdrawingDisabled ||
                    !hasWithdrawableAmount ||
                    isSubmitting ||
                    isDeviceUnavailable ||
                    !!pendingTxid
                }
                isLoading={isSubmitting || isDiscoveryRunning}
            >
                <Translation id="TR_CONTINUE" />
            </Button>
        </Tooltip>
    );
};
