import { useWatch } from 'react-hook-form';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { getTotalVotes, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';
import {
    getRemainingVotes,
    getVotingDelegationAnalyticsValue,
    parseVoteAllocations,
} from '../utils/voteUtils';

export const TronVoteSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions, fees, representatives } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { control } = form.methods;

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const hasInsufficientFunds = fees.composedLevels?.normal?.type === 'error';

    const allocations = useWatch({ control, name: 'voteAllocations' });
    const parsedAllocations = parseVoteAllocations(allocations);
    const hasVotesToSubmit = parsedAllocations.some(({ count }) => count > 0);
    const isOverAllocated =
        getRemainingVotes({ totalVotes: getTotalVotes(account), allocations }) < 0;

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
                votingDelegation: getVotingDelegationAnalyticsValue(
                    parsedAllocations,
                    representatives.data,
                ),
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
                    !hasVotesToSubmit ||
                    isOverAllocated ||
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
