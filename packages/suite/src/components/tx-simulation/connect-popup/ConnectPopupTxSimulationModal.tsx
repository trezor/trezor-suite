import { useTxSimulationPopupCall } from '@suite-common/connect-popup';

import { ConnectPopupTxSimulationModalInner } from './ConnectPopupTxSimulationModalInner';

export const ConnectPopupTxSimulationModal = () => {
    const txSimulationCallWithAccount = useTxSimulationPopupCall();

    if (!txSimulationCallWithAccount) {
        return null;
    }

    const { action, account, source } = txSimulationCallWithAccount;

    return <ConnectPopupTxSimulationModalInner action={action} account={account} source={source} />;
};
