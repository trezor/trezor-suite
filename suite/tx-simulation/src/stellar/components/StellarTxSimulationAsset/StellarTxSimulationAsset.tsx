import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { Translation } from '@suite/intl';
import { type StellarAssetDiff, getStellarAssetDiffLabel } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { StellarTxSimulationAssetLogo } from './StellarTxSimulationAssetLogo';
import { TxSimulationAssetRow } from '../../../common';

interface StellarTxSimulationAssetProps {
    assetDiff: StellarAssetDiff;
    network: Network;
}

export function StellarTxSimulationAsset({ assetDiff, network }: StellarTxSimulationAssetProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { asset, in: received, out: sent } = assetDiff;

    return (
        <Row columnGap={8} padding={{ horizontal: 16, vertical: 12 }}>
            <StellarTxSimulationAssetLogo asset={asset} network={network} />

            {sent && (
                <TxSimulationAssetRow
                    intent="critical"
                    fiatAmount={
                        sent.usd_price
                            ? { prefix: '-', value: String(sent.usd_price), currency: 'USD' }
                            : undefined
                    }
                    dataTestId="@sign-message-modal/tx-simulation-out-0"
                >
                    <Translation
                        id="TR_SIMULATION_SENDING_ASSET"
                        values={{
                            amount: getStellarAssetDiffLabel(
                                networkConfigDeps,
                                assetDiff,
                                sent,
                                network.symbol,
                            ),
                        }}
                    />
                </TxSimulationAssetRow>
            )}
            {received && (
                <TxSimulationAssetRow
                    intent="brand"
                    fiatAmount={
                        received.usd_price
                            ? { prefix: '+', value: String(received.usd_price), currency: 'USD' }
                            : undefined
                    }
                    dataTestId="@sign-message-modal/tx-simulation-in-0"
                >
                    <Translation
                        id="TR_SIMULATION_RECEIVING_ASSET"
                        values={{
                            amount: getStellarAssetDiffLabel(
                                networkConfigDeps,
                                assetDiff,
                                received,
                                network.symbol,
                            ),
                        }}
                    />
                </TxSimulationAssetRow>
            )}
        </Row>
    );
}
