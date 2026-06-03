import { type Account } from '@suite-common/wallet-types';

import { TronStakeContext } from './TronStakeContext';
import { useTronStakeFlow } from './hooks/useTronStakeFlow';

interface TronStakeProps {
    account: Account;
}

export const TronStake = ({ account }: TronStakeProps) => {
    const context = useTronStakeFlow({ account });

    return <TronStakeContext.Provider value={context}>{null}</TronStakeContext.Provider>;
};
