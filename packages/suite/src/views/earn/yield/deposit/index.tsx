import { YieldDeposit } from 'src/components/earn';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';
import { useEarnLayout } from '../useEarnLayout';

export const EarnDeposit = () => {
    const result = useEarnLayout({
        type: 'deposit',
        fallbackTitleId: 'TR_EARN_YIELD_DEPOSIT',
    });

    if (result.status !== 'valid') {
        return <EarnLayoutFallback layoutState={result} />;
    }

    return <YieldDeposit account={result.account} vault={result.vault} />;
};
