import { EarnLayoutFallback, YieldDeposit, useEarnLayout } from '@trezor/suite';

export const EarnDepositPage = () => {
    const result = useEarnLayout({
        type: 'deposit',
        fallbackTitleId: 'TR_EARN_YIELD_DEPOSIT',
    });

    if (result.status !== 'valid') {
        return <EarnLayoutFallback layoutState={result} />;
    }

    return <YieldDeposit account={result.account} vault={result.vault} />;
};
