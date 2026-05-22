import { YieldSupply } from 'src/components/earn';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';
import { useEarnLayout } from '../useEarnLayout';

export const EarnDeposit = () => {
    const result = useEarnLayout({
        type: 'deposit',
        fallbackTitleId: 'TR_EARN_YIELD_SUPPLY',
    });

    if (result.status !== 'valid') {
        return <EarnLayoutFallback layoutState={result} />;
    }

    return (
        <YieldSupply
            account={result.account}
            routeParams={result.routeParams}
            vault={result.vault}
        />
    );
};
