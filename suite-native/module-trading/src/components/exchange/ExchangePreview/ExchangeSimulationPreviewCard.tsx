import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { Card } from '@suite-native/atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { TxSimulationAssetRows } from '@suite-native/tx-simulation';

import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';

export const ExchangeSimulationPreviewCard = () => {
    const account = useSelector(selectExchangeSelectedSendAccount);
    const { data: simulationResult } = useDexExchangeTxSimulation();

    if (!account || !simulationResult) {
        return null;
    }

    return (
        <Card noPadding>
            <TxSimulationAssetRows
                result={simulationResult}
                network={getNetwork(account.symbol)}
                assetVariant="wrap"
            />
        </Card>
    );
};
