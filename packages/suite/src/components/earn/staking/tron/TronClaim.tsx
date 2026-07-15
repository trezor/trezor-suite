import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { TronClaimForm } from './claim/TronClaimForm';
import { TronClaimSummaryCard } from './complete/TronClaimSummaryCard';
import { TronStakeComplete } from './complete/TronStakeComplete';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';

interface TronClaimProps {
    account: Account;
}

export const TronClaim = ({ account }: TronClaimProps) => {
    const context = useTronStakeFlow({ account, flow: 'claim' });
    const { step } = context.actions;

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {step === 'complete' ? (
                        <TronStakeComplete
                            account={account}
                            heading={<Translation id="TR_EARN_TRON_CLAIM_COMPLETE" />}
                            description={<Translation id="TR_EARN_TRON_CLAIM_DESCRIPTION" />}
                        >
                            <TronClaimSummaryCard />
                        </TronStakeComplete>
                    ) : (
                        <TronClaimForm />
                    )}
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
