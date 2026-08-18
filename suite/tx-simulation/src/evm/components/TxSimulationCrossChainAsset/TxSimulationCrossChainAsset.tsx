import { Translation } from '@suite/intl';
import { type CrossChainAssetDiff, getNetworkByBlockaidChain } from '@suite-common/tx-simulation';
import { IconCircle, Row } from '@trezor/components';
import { CoinsIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { TxSimulationAssetRow } from '../../../common';

type CrossChainTransfer = CrossChainAssetDiff['in'][number];

interface TxSimulationCrossChainAssetProps {
    assetDiff: CrossChainAssetDiff;
}

export function TxSimulationCrossChainAsset({ assetDiff }: TxSimulationCrossChainAssetProps) {
    const { asset, chain } = assetDiff;
    // Blockaid reports on more chains than Suite holds, so fall back to its own chain name.
    const network = getNetworkByBlockaidChain(chain);

    const summary = (transfer: CrossChainTransfer) =>
        transfer.summary ?? `${transfer.value ?? transfer.raw_value} ${asset.symbol ?? ''}`.trim();

    const renderTransfers = (
        transfers: ReadonlyArray<CrossChainTransfer>,
        intent: 'brand' | 'critical',
        prefix: '+' | '-',
        testIdPart: string,
    ) =>
        transfers.map((transfer, index) => (
            <TxSimulationAssetRow
                key={`${testIdPart}-${index}`}
                intent={intent}
                fiatAmount={
                    transfer.usd_price
                        ? { prefix, value: transfer.usd_price, currency: 'USD' }
                        : undefined
                }
                dataTestId={`@sign-message-modal/tx-simulation-cross-chain-${testIdPart}-${index}`}
            >
                <Translation
                    id="TR_SIMULATION_CROSS_CHAIN_ASSET"
                    values={{ amount: summary(transfer), chain: network?.name ?? chain }}
                />
            </TxSimulationAssetRow>
        ));

    return (
        <Row columnGap={8} padding={{ horizontal: 16, vertical: 12 }}>
            {network && asset.symbol ? (
                <TokenIcon
                    symbol={network.symbol}
                    contractAddress={'address' in asset ? asset.address : undefined}
                    size={32}
                    placeholder={asset.name ?? asset.symbol}
                    customLogoUrl={asset.logo_url}
                />
            ) : (
                <IconCircle icon={CoinsIcon} size={32} intent="neutral" />
            )}

            {renderTransfers(assetDiff.out, 'critical', '-', 'out')}
            {renderTransfers(assetDiff.in, 'brand', '+', 'in')}
        </Row>
    );
}
