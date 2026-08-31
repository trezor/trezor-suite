import { useFormState, useWatch } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from '@suite-common/redux-utils';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';
import { CUSTOM_REPRESENTATIVE } from './constants';

export const TronVoteSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions, fees } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { control } = form.methods;

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const hasInsufficientFunds = fees.composedLevels?.normal?.type === 'error';

    const representative = useWatch({ control, name: 'representative' });
    const customRepresentativeAddress = useWatch({ control, name: 'customRepresentativeAddress' });
    const { errors } = useFormState({ control });

    const isRepresentativeSelected =
        representative === CUSTOM_REPRESENTATIVE
            ? customRepresentativeAddress.trim().length > 0 && !errors.customRepresentativeAddress
            : representative.length > 0;

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        if (isVotingDisabled) {
            return;
        }

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
        <Tooltip content={votingMessageContent}>
            <Button
                size="large"
                width="100%"
                onClick={handleClick}
                isDisabled={
                    isVotingDisabled ||
                    !isRepresentativeSelected ||
                    isSubmitting ||
                    isDeviceLocked ||
                    hasInsufficientFunds ||
                    !!pendingTxid
                }
                isLoading={isSubmitting || isDiscoveryRunning}
            >
                <Translation id="TR_CONTINUE" />
            </Button>
        </Tooltip>
    );
};
