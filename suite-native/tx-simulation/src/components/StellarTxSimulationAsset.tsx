import { type StellarAssetDiff } from '@suite-common/tx-simulation';
import { type Network, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { BigNumber } from '@trezor/utils';

import { EvmTxSimulationAssetAmount } from './EvmTxSimulationAssetAmount';

type StellarTransfer = NonNullable<StellarAssetDiff['in'] | StellarAssetDiff['out']>;

type StellarTxSimulationAssetProps = {
    assetDiff: StellarAssetDiff;
    network: Network;
};

const getSummary = (transfer: StellarTransfer, { asset }: StellarAssetDiff, network: Network) => {
    if (transfer.summary) {
        return transfer.summary;
    }

    const symbol =
        'symbol' in asset ? asset.symbol : (asset.code ?? getNetworkDisplaySymbol(network.symbol));

    return `${transfer.value} ${symbol}`;
};

export const StellarTxSimulationAsset = ({ assetDiff, network }: StellarTxSimulationAssetProps) => {
    // Unlike EVM, Stellar reports at most one transfer per direction.
    const { in: received, out: sent, asset } = assetDiff;

    return (
        <HStack spacing="sp12" padding="sp16" alignItems="center">
            <TokenIcon
                symbol={network.symbol}
                contractAddress={'address' in asset ? asset.address : undefined}
                size="small"
                showNetworkIcon={'address' in asset}
            />
            <VStack flex={1} spacing="sp8">
                {sent && (
                    <HStack alignItems="center" spacing="sp8">
                        <EvmTxSimulationAssetAmount
                            fiatAmount={
                                sent.usd_price
                                    ? asBaseCurrencyAmount(new BigNumber(sent.usd_price))
                                    : undefined
                            }
                            fiatSign="- "
                            summary={getSummary(sent, assetDiff, network)}
                            summaryColor="contentCritical"
                        />
                    </HStack>
                )}
                {received && (
                    <HStack alignItems="center" spacing="sp8">
                        <EvmTxSimulationAssetAmount
                            fiatAmount={
                                received.usd_price
                                    ? asBaseCurrencyAmount(new BigNumber(received.usd_price))
                                    : undefined
                            }
                            fiatSign="+ "
                            summary={getSummary(received, assetDiff, network)}
                            summaryColor="contentBrand"
                        />
                    </HStack>
                )}
            </VStack>
        </HStack>
    );
};
