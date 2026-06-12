import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';
import { TronWithdrawForm } from './withdraw/TronWithdrawForm';

interface TronWithdrawProps {
    account: Account;
}

export const TronWithdraw = ({ account }: TronWithdrawProps) => {
    const context = useTronStakeFlow({ account, flow: 'withdraw' });

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    <TronWithdrawForm />
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
