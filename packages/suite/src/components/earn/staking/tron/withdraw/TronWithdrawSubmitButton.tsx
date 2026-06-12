import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { getWithdrawableAmount, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';

export const TronWithdrawSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;

    const hasWithdrawableAmount = new BigNumber(getWithdrawableAmount(account)).gt(0);
    const isDeviceUnavailable = !!device?.connected && !!device?.available && isLocked();

    return (
        <Button
            size="large"
            width="100%"
            onClick={submitAction}
            isDisabled={
                !hasWithdrawableAmount || isSubmitting || isDeviceUnavailable || !!pendingTxid
            }
            isLoading={isSubmitting || isDiscoveryRunning}
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};
