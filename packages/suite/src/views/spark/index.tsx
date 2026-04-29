import { SparkHistoryView } from '@suite-common/spark';

import { SparkLayout } from './SparkLayout';
import { useSparkWallet } from './useSparkWallet';

export const SparkIndex = () => {
    const { goToSparkRoute, selectedAccount, wallet } = useSparkWallet();

    return (
        <SparkLayout>
            {selectedAccount && wallet && (
                <SparkHistoryView
                    accountNumber={selectedAccount.accountNumber}
                    balanceSats={wallet.balanceSats}
                    transfers={wallet.transfers}
                    onOpenReceive={() => goToSparkRoute('spark-receive')}
                    onOpenSend={() => goToSparkRoute('spark-send')}
                />
            )}
        </SparkLayout>
    );
};
