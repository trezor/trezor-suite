import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { getTronStakingRewards } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';

export const TronClaimSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;

    const hasReward = new BigNumber(getTronStakingRewards(account)).gt(0);
    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    const isDisabled = !hasReward || isSubmitting || isDeviceLocked || !!pendingTxid;
    const isLoading = isSubmitting || isDiscoveryRunning;

    return (
        <Button
            size="large"
            width="100%"
            onClick={submitAction}
            isDisabled={isDisabled}
            isLoading={isLoading}
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};
