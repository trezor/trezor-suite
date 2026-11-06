import { EarnLayoutFallback, YieldWithdraw, useEarnLayout } from '@trezor/suite';

export const EarnWithdrawPage = () => {
    const result = useEarnLayout({
        type: 'withdraw',
        fallbackTitleId: 'TR_EARN_YIELD_WITHDRAW_TITLE',
    });

    if (result.status !== 'valid') {
        return <EarnLayoutFallback layoutState={result} />;
    }

    return <YieldWithdraw account={result.account} vault={result.vault} />;
};
