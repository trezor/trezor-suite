import { useFormState, useWatch } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';
import { CUSTOM_REPRESENTATIVE } from './constants';

export const TronVoteSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { control } = form.methods;

    const representative = useWatch({ control, name: 'representative' });
    const customRepresentativeAddress = useWatch({ control, name: 'customRepresentativeAddress' });
    const { errors } = useFormState({ control });

    const isRepresentativeSelected =
        representative === CUSTOM_REPRESENTATIVE
            ? customRepresentativeAddress.trim().length > 0 && !errors.customRepresentativeAddress
            : representative.length > 0;

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        submitAction();

        if (!device?.connected || !device?.available) {
            return;
        }

        analytics.report({
            type: events.stakingUpdateProviderEvent.name,
            payload: {
                action: 'continue',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
                votingDelegation: representative,
            },
        });
    };

    return (
        <Button
            size="large"
            width="100%"
            onClick={handleClick}
            isDisabled={
                !isRepresentativeSelected || isSubmitting || isDeviceLocked || !!pendingTxid
            }
            isLoading={isSubmitting || isDiscoveryRunning}
        >
            <Translation id="TR_CONTINUE" />
        </Button>
    );
};
