import { useTxSimulationPopupCall } from '@suite-common/connect-popup';

import { TxSimulationModalInner } from './TxSimulationModalInner';

export const TxSimulationModal = () => {
    const txSimulationCallWithAccount = useTxSimulationPopupCall();

    if (!txSimulationCallWithAccount) {
        return null;
    }

    const { action, account } = txSimulationCallWithAccount;

    return <TxSimulationModalInner action={action} account={account} />;
};
