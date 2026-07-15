import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { getTronWithdrawableBalance } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';

export const TronWithdrawSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;

    const hasWithdrawableAmount = new BigNumber(getTronWithdrawableBalance(account)).gt(0);
    const isDeviceUnavailable = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
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
        <Button
            size="large"
            width="100%"
            onClick={handleClick}
            isDisabled={
                !hasWithdrawableAmount || isSubmitting || isDeviceUnavailable || !!pendingTxid
            }
            isLoading={isSubmitting || isDiscoveryRunning}
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};
