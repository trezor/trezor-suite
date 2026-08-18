import { type StellarAssetDiff } from '@suite-common/tx-simulation';
import { type Network, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { StellarTxSimulationAssetLogo } from './StellarTxSimulationAssetLogo';
import { TxSimulationAssetRow } from '../../../common';

type StellarTransfer = NonNullable<StellarAssetDiff['in'] | StellarAssetDiff['out']>;

interface StellarTxSimulationAssetProps {
    assetDiff: StellarAssetDiff;
    network: Network;
}

// Stellar assets carry no decimals, so `value` is the only usable amount.
const getSummary = (
    transfer: StellarTransfer,
    { asset }: StellarAssetDiff,
    network: Network,
): string => {
    if (transfer.summary) {
        return transfer.summary;
    }

    const code =
        'symbol' in asset ? asset.symbol : (asset.code ?? getNetworkDisplaySymbol(network.symbol));

    return `${transfer.value} ${code}`;
};

export function StellarTxSimulationAsset({ assetDiff, network }: StellarTxSimulationAssetProps) {
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
