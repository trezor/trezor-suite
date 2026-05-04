import { goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import {
    SparkHistoryView,
    selectSelectedSparkAccount,
    selectSparkWalletByAccountNumber,
} from '@suite-common/spark';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { SparkLayout } from './SparkLayout';

export const SparkIndex = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const walletDescriptor = deviceStaticSessionId
        ? parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor
        : null;
    const selectedAccount = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccount(state, walletDescriptor) : undefined,
    );
    const wallet = useSelector(state =>
        walletDescriptor && selectedAccount
            ? selectSparkWalletByAccountNumber(state, {
                  accountNumber: selectedAccount.accountNumber,
                  walletDescriptor,
              })
            : undefined,
    );

    return (
        <SparkLayout>
            {selectedAccount && wallet && (
                <SparkHistoryView
                    accountNumber={selectedAccount.accountNumber}
                    balanceSats={wallet.balanceSats}
                    transfers={wallet.transfers}
                    onOpenReceive={() => dispatch(goto({ routeName: 'spark-receive' }))}
                    onOpenSend={() => dispatch(goto({ routeName: 'spark-send' }))}
                />
            )}
        </SparkLayout>
    );
};
