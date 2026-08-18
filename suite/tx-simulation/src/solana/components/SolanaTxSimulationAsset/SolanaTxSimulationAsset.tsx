import { type SolanaAssetDiff } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { SolanaTxSimulationAssetLogo } from './SolanaTxSimulationAssetLogo';
import { TxSimulationAssetRow } from '../../../common';

type SolanaTransfer = NonNullable<SolanaAssetDiff['in'] | SolanaAssetDiff['out']>;

interface SolanaTxSimulationAssetProps {
    assetDiff: SolanaAssetDiff;
    network: Network;
}

const getSummary = (
    transfer: SolanaTransfer,
    { asset }: SolanaAssetDiff,
    network: Network,
): string => {
    if (transfer.summary) {
        return transfer.summary;
    }

    const symbol = 'symbol' in asset ? asset.symbol : getNetworkDisplaySymbol(network.symbol);

    return `${transfer.value} ${symbol}`;
};

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
                    {getSummary(sent, assetDiff, network)}
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
                    {getSummary(received, assetDiff, network)}
                </TxSimulationAssetRow>
            )}
        </Row>
    );
}
