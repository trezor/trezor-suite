import { useFormState } from 'react-hook-form';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';

export const TronUnstakeSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { form, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { isValid } = useFormState({ control: form.methods.control });

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    return (
        <Button
            size="large"
            width="100%"
            onClick={submitAction}
            isDisabled={!isValid || isSubmitting || isDeviceLocked || !!pendingTxid}
            isLoading={isSubmitting || isDiscoveryRunning}
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};
