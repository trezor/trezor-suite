import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { TronStakeComplete } from './complete/TronStakeComplete';
import { TronUnstakeSummaryCard } from './complete/TronUnstakeSummaryCard';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';
import { TronUnstakeForm } from './unstake/TronUnstakeForm';

interface TronUnstakeProps {
    account: Account;
}

export const TronUnstake = ({ account }: TronUnstakeProps) => {
    const context = useTronStakeFlow({ account, flow: 'unstake' });
    const { step } = context.actions;

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {step === 'complete' ? (
                        <TronStakeComplete
                            account={account}
                            heading={<Translation id="TR_EARN_TRON_UNSTAKE_COMPLETE" />}
                            description={<Translation id="TR_EARN_TRON_UNSTAKE_DESCRIPTION" />}
                        >
                            <TronUnstakeSummaryCard />
                        </TronStakeComplete>
                    ) : (
                        <TronUnstakeForm />
                    )}
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
