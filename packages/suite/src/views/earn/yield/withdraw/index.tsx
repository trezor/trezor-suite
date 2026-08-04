import { YieldWithdraw } from 'src/components/earn';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';
import { useEarnLayout } from '../useEarnLayout';

export const EarnWithdraw = () => {
    const result = useEarnLayout({
        type: 'withdraw',
        fallbackTitleId: 'TR_EARN_YIELD_WITHDRAW',
    });

    if (result.status !== 'valid') {
        return <EarnLayoutFallback layoutState={result} />;
    }

    return <YieldWithdraw account={result.account} vault={result.vault} />;
};
