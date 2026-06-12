import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';
import { TronUnstakeForm } from './unstake/TronUnstakeForm';

interface TronUnstakeProps {
    account: Account;
}

export const TronUnstake = ({ account }: TronUnstakeProps) => {
    const context = useTronStakeFlow({ account, flow: 'unstake' });

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    <TronUnstakeForm />
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
