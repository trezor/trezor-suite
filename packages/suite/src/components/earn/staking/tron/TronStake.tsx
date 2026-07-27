import { Translation } from '@suite/intl';
import { TRON_FLOW_STEPS, type TronStakeStepId } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, StepList, type StepListItemState, Text } from '@trezor/components';

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
    const getStepState = (stepId: TronStakeStepId): StepListItemState => {
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
                            account={account}
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

                            <StepList
                                isOrdered
                                bulletSize="large"
                                bulletGap={12}
                                gap={24}
                                titleGap={16}
                            >
                                <StepList.Item
                                    state={getStepState('freeze')}
                                    title={
                                        <Column gap={2} width="100%">
                                            <Text
                                                typographyStyle="body-xs"
                                                intent="neutral"
                                                priority="secondary"
                                                case="uppercase"
                                            >
                                                <Translation
                                                    id="TR_STEP_OF_TOTAL"
                                                    values={{ index: 1, total: 2 }}
                                                />
                                            </Text>

                                            <Translation id="TR_EARN_TRON_FREEZE_STEP_TITLE" />
                                        </Column>
                                    }
                                >
                                    {step === 'freeze' && <TronFreezeStep />}
                                </StepList.Item>

                                <StepList.Item
                                    state={getStepState('vote')}
                                    title={
                                        <Column gap={2} width="100%">
                                            <Text
                                                typographyStyle="body-xs"
                                                intent="neutral"
                                                priority="secondary"
                                                case="uppercase"
                                            >
                                                <Translation
                                                    id="TR_STEP_OF_TOTAL"
                                                    values={{ index: 2, total: 2 }}
                                                />
                                            </Text>

                                            <Translation id="TR_EARN_TRON_VOTE_STEP_TITLE" />
                                        </Column>
                                    }
                                >
                                    {step === 'vote' && <TronVoteStep />}
                                </StepList.Item>
                            </StepList>
                        </>
                    )}
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
