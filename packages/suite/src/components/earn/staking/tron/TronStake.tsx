import { Translation } from '@suite/intl';
import { TRON_STAKE_FLOW_STEPS, type TronStakeStepId } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BulletList, type BulletListItemState, Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { TronFreezeStep } from './freeze/TronFreezeStep';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';

interface TronStakeProps {
    account: Account;
}

export const TronStake = ({ account }: TronStakeProps) => {
    const context = useTronStakeFlow({ account });
    const { step } = context.actions;

    const currentStepIndex = TRON_STAKE_FLOW_STEPS.indexOf(step);
    const getStepState = (stepId: TronStakeStepId): BulletListItemState => {
        const stepIndex = TRON_STAKE_FLOW_STEPS.indexOf(stepId);

        if (stepIndex < currentStepIndex) {
            return 'done';
        }

        return stepIndex === currentStepIndex ? 'active' : 'pending';
    };

    return (
        <TronStakeContext.Provider value={context}>
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
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
                        />
                        <BulletList.Item
                            state={getStepState('complete')}
                            title={<Translation id="TR_EARN_TRON_EARN_STEP_TITLE" />}
                        />
                    </BulletList>
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
