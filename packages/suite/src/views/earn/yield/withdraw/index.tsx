import { YieldWithdraw } from 'src/components/earn';

import { useEarnLayout } from '../useEarnLayout';

export const EarnWithdraw = () => {
    const result = useEarnLayout({
        type: 'withdraw',
        fallbackTitleId: 'TR_EARN_YIELD_WITHDRAW',
    });

    if (!result.isValid) {
        return result.fallback;
    }

    return <YieldWithdraw account={result.account} routeParams={result.routeParams} />;
};
