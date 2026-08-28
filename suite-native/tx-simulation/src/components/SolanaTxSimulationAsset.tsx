import { type SolanaAssetDiff, getSolanaAssetDiffLabel } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { EvmTxSimulationAssetAmount } from './EvmTxSimulationAssetAmount';

type SolanaTxSimulationAssetProps = {
    assetDiff: SolanaAssetDiff;
    network: Network;
};

export const SolanaTxSimulationAsset = ({ assetDiff, network }: SolanaTxSimulationAssetProps) => {
    // Unlike EVM, Solana reports at most one transfer per direction.
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
                            summary={
                                <Translation
                                    id="moduleConnectPopup.simulation.sendingAsset"
                                    values={{
                                        amount: getSolanaAssetDiffLabel(
                                            assetDiff,
                                            sent,
                                            network.symbol,
                                        ),
                                    }}
                                />
                            }
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
                            summary={
                                <Translation
                                    id="moduleConnectPopup.simulation.receivingAsset"
                                    values={{
                                        amount: getSolanaAssetDiffLabel(
                                            assetDiff,
                                            received,
                                            network.symbol,
                                        ),
                                    }}
                                />
                            }
                            summaryColor="contentBrand"
                        />
                    </HStack>
                )}
            </VStack>
        </HStack>
    );
};
