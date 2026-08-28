import { type CrossChainAssetDiff, getNetworkByBlockaidChain } from '@suite-common/tx-simulation';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, VStack } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { EvmTxSimulationAssetAmount } from './EvmTxSimulationAssetAmount';

type CrossChainTransfer = CrossChainAssetDiff['in'][number];

type TxSimulationCrossChainAssetProps = {
    assetDiff: CrossChainAssetDiff;
};

export const TxSimulationCrossChainAsset = ({ assetDiff }: TxSimulationCrossChainAssetProps) => {
    const { asset, chain } = assetDiff;
    // Blockaid reports on more chains than Suite holds, so fall back to its own chain name.
    const network = getNetworkByBlockaidChain(chain);

    const renderTransfers = (
        transfers: ReadonlyArray<CrossChainTransfer>,
        fiatSign: string,
        summaryColor: 'contentBrand' | 'contentCritical',
        key: string,
    ) =>
        transfers.map((transfer, index) => (
            <HStack key={`${key}-${index}`} alignItems="center" spacing="sp8">
                <EvmTxSimulationAssetAmount
                    fiatAmount={
                        transfer.usd_price
                            ? asBaseCurrencyAmount(new BigNumber(transfer.usd_price))
                            : undefined
                    }
                    fiatSign={fiatSign}
                    summary={
                        <Translation
                            id="moduleConnectPopup.simulation.crossChainAsset"
                            values={{
                                amount:
                                    transfer.summary ??
                                    `${transfer.value ?? transfer.raw_value} ${asset.symbol ?? ''}`.trim(),
                                chain: network?.name ?? chain,
                            }}
                        />
                    }
                    summaryColor={summaryColor}
                />
            </HStack>
        ));

    return (
        <HStack spacing="sp12" padding="sp16" alignItems="center">
            {network && asset.symbol ? (
                <TokenIcon
                    symbol={network.symbol}
                    contractAddress={'address' in asset ? asset.address : undefined}
                    size="small"
                    showNetworkIcon
                />
            ) : (
                <Icon name="coins" size="small" />
            )}
            <VStack flex={1} spacing="sp8">
                {renderTransfers(assetDiff.out, '- ', 'contentCritical', 'out')}
                {renderTransfers(assetDiff.in, '+ ', 'contentBrand', 'in')}
            </VStack>
        </HStack>
    );
};
