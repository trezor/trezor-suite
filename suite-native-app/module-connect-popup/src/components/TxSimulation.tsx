import { useTxSimulationPopupCall } from '@suite-common/connect-popup';

import { TxSimulationInner } from './TxSimulationInner';

export const TxSimulation = () => {
    const txSimulationCallWithAccount = useTxSimulationPopupCall();

    if (!txSimulationCallWithAccount) {
        return null;
    }

    return <TxSimulationInner {...txSimulationCallWithAccount} />;
};
