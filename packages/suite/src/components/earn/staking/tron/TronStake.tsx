import { Translation } from '@suite/intl';
import { TRON_FLOW_STEPS, type TronStakeStepId } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BulletList, type BulletListItemState, Column, Text } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { TronStakeComplete } from './complete/TronStakeComplete';
import { TronStakeSummaryCard } from './complete/TronStakeSummaryCard';
import { TronFreezeStep } from './freeze/TronFreezeStep';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';
import { TronVoteStep } from './vote/TronVoteStep';

interface TronStakeProps {
    account: Account;
}

export const TronStake = ({ account }: TronStakeProps) => {
    const context = useTronStakeFlow({ account, flow: 'stake' });
    const { step } = context.actions;

    const stakeSteps: readonly TronStakeStepId[] = TRON_FLOW_STEPS.stake;
    const currentStepIndex = stakeSteps.indexOf(step);
    const getStepState = (stepId: TronStakeStepId): BulletListItemState => {
        const stepIndex = stakeSteps.indexOf(stepId);

        if (stepIndex < currentStepIndex) {
            return 'done';
        }

        return stepIndex === currentStepIndex ? 'active' : 'pending';
    };

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {step === 'complete' ? (
                        <TronStakeComplete
                            heading={<Translation id="TR_EARN_TRON_STAKE_COMPLETE" />}
                            description={
                                <Translation id="TR_EARN_TRON_STAKE_COMPLETE_DESCRIPTION" />
                            }
                        >
                            <TronStakeSummaryCard />
                        </TronStakeComplete>
                    ) : (
                        <>
                            <Text typographyStyle="headline-md">
                                <Translation id="TR_EARN_TRON_STAKE_TITLE" />
                            </Text>
                            <BulletList bulletSize="small" bulletGap={12} gap={24} titleGap={16}>
                                <BulletList.Item
                                    state={getStepState('freeze')}
                                    title={<Translation id="TR_EARN_TRON_FREEZE_STEP_TITLE" />}
                                >
                                    {step === 'freeze' && <TronFreezeStep />}
                                </BulletList.Item>
                                <BulletList.Item
                                    state={getStepState('vote')}
                                    title={<Translation id="TR_EARN_TRON_VOTE_STEP_TITLE" />}
                                >
                                    {step === 'vote' && <TronVoteStep />}
                                </BulletList.Item>
                            </BulletList>
                        </>
                    )}
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
