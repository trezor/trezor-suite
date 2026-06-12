import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TronStakeContext } from './TronStakeContext';
import { TronClaimForm } from './claim/TronClaimForm';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';

interface TronClaimProps {
    account: Account;
}

export const TronClaim = ({ account }: TronClaimProps) => {
    const context = useTronStakeFlow({ account, flow: 'claim' });

    return (
        <TronStakeContext.Provider value={context}>
            <Column alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    <TronClaimForm />
                </Column>
            </Column>
        </TronStakeContext.Provider>
    );
};
