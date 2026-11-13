import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, VStack } from '@suite-native/atoms';
import { BigNumber } from '@trezor/utils';

import { EvmTxSimulationAssetAmount } from './EvmTxSimulationAssetAmount';
import { EvmTxSimulationAssetIcon } from './EvmTxSimulationAssetIcon';
import { type EvmTxSimulationAssetProps } from './EvmTxSimulationAssetTypes';
import { EvmTxSimulationSummary } from './EvmTxSimulationSummary';

export const EvmTxSimulationStackedAsset = ({
    assetDiff,
    assetExposure,
    network,
}: EvmTxSimulationAssetProps) => (
    <HStack spacing="sp12" padding="sp16" alignItems="center">
        <EvmTxSimulationAssetIcon
            assetDiff={assetDiff}
            assetExposure={assetExposure}
            network={network}
        />
        <VStack flex={1} spacing="sp8">
            {assetDiff?.in.map((inAmount, index) => (
                <HStack key={`in-${index}`} alignItems="center" spacing="sp8">
                    <EvmTxSimulationAssetAmount
                        fiatAmount={
                            inAmount.usd_price
                                ? asBaseCurrencyAmount(new BigNumber(inAmount.usd_price))
                                : undefined
                        }
                        fiatSign="+ "
                        summary={
                            <EvmTxSimulationSummary
                                assetDiff={assetDiff}
                                transfer={inAmount}
                                networkSymbol={network.symbol}
                                direction="in"
                                color="contentBrand"
                            />
                        }
                        summaryColor="contentBrand"
                    />
                </HStack>
            ))}
            {assetDiff?.out.map((outAmount, index) => (
                <HStack key={`out-${index}`} alignItems="center" spacing="sp8">
                    <EvmTxSimulationAssetAmount
                        fiatAmount={
                            outAmount.usd_price
                                ? asBaseCurrencyAmount(new BigNumber(outAmount.usd_price))
                                : undefined
                        }
                        fiatSign="- "
                        summary={
                            <EvmTxSimulationSummary
                                assetDiff={assetDiff}
                                transfer={outAmount}
                                networkSymbol={network.symbol}
                                direction="out"
                                color="contentCritical"
                            />
                        }
                        summaryColor="contentCritical"
                    />
                </HStack>
            ))}
            {assetExposure?.spenders &&
                Object.values(assetExposure.spenders).map((spender, index) => (
                    <HStack key={`spender-${index}`} alignItems="center" spacing="sp8">
                        <EvmTxSimulationAssetAmount
                            fiatAmount={spender.exposure.usd_price}
                            summary={spender.summary}
                            summaryColor="contentSecondary"
                        />
                    </HStack>
                ))}
        </VStack>
    </HStack>
);
