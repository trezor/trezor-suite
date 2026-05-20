import { YieldSupply } from 'src/components/earn';

import { useEarnLayout } from '../useEarnLayout';

export const EarnDeposit = () => {
    const result = useEarnLayout({
        type: 'deposit',
        fallbackTitleId: 'TR_EARN_YIELD_SUPPLY',
    });

    if (!result.isValid) {
        return result.fallback;
    }

    return <YieldSupply account={result.account} routeParams={result.routeParams} />;
};
