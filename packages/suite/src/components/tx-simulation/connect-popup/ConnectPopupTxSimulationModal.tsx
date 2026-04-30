import { useTxSimulationPopupCall } from '@suite-common/connect-popup';

import { ConnectPopupTxSimulationModalInner } from './ConnectPopupTxSimulationModalInner';

export const ConnectPopupTxSimulationModal = () => {
    const txSimulationCallWithAccount = useTxSimulationPopupCall();

    if (!txSimulationCallWithAccount) {
        return null;
    }

    const { action, account } = txSimulationCallWithAccount;

    return <ConnectPopupTxSimulationModalInner action={action} account={account} />;
};
