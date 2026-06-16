import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { TronStakeComplete } from './complete/TronStakeComplete';
import { TronWithdrawSummaryCard } from './complete/TronWithdrawSummaryCard';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';
import { TronWithdrawForm } from './withdraw/TronWithdrawForm';

interface TronWithdrawProps {
    account: Account;
}

export const TronWithdraw = ({ account }: TronWithdrawProps) => {
    const context = useTronStakeFlow({ account, flow: 'withdraw' });
    const { step } = context.actions;

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {step === 'complete' ? (
                        <TronStakeComplete
                            heading={<Translation id="TR_EARN_TRON_WITHDRAW_COMPLETE" />}
                            description={<Translation id="TR_EARN_TRON_WITHDRAW_DESCRIPTION" />}
                        >
                            <TronWithdrawSummaryCard />
                        </TronStakeComplete>
                    ) : (
                        <TronWithdrawForm />
                    )}
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
