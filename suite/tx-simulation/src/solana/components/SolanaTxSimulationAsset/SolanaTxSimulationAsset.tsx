import { Translation } from '@suite/intl';
import { type SolanaAssetDiff, getSolanaAssetDiffLabel } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { SolanaTxSimulationAssetLogo } from './SolanaTxSimulationAssetLogo';
import { TxSimulationAssetRow } from '../../../common';

interface SolanaTxSimulationAssetProps {
    assetDiff: SolanaAssetDiff;
    network: Network;
}

export function SolanaTxSimulationAsset({ assetDiff, network }: SolanaTxSimulationAssetProps) {
    // Unlike EVM, Solana reports at most one transfer per direction.
    const { in: received, out: sent } = assetDiff;

    return (
        <Row columnGap={8} padding={{ horizontal: 16, vertical: 12 }}>
            <SolanaTxSimulationAssetLogo asset={assetDiff.asset} network={network} />

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
                            amount: getSolanaAssetDiffLabel(assetDiff, sent, network.symbol),
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
                            amount: getSolanaAssetDiffLabel(assetDiff, received, network.symbol),
                        }}
                    />
                </TxSimulationAssetRow>
            )}
        </Row>
    );
}
