import { useFormState } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from '@suite-common/redux-utils';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';

export const TronUnstakeSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { isValid } = useFormState({ control: form.methods.control });

    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        if (isUnstakingDisabled) {
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
                step: 'unstake-form-modal',
                networkSymbol: account.symbol,
                currency: amountInput.currency,
                resource: form.methods.getValues().resourceType,
            },
        });
    };

    return (
        <Tooltip content={unstakingMessageContent}>
            <Button
                size="large"
                width="100%"
                onClick={handleClick}
                isDisabled={
                    isUnstakingDisabled ||
                    !isValid ||
                    isSubmitting ||
                    isDeviceLocked ||
                    !!pendingTxid
                }
                isLoading={isSubmitting || isDiscoveryRunning}
            >
                <Translation id="TR_CONTINUE" />
            </Button>
        </Tooltip>
    );
};
