import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { BigNumber } from '@trezor/utils';

import { EvmTxSimulationAssetAmount } from './EvmTxSimulationAssetAmount';
import { EvmTxSimulationAssetIcon } from './EvmTxSimulationAssetIcon';
import { type EvmTxSimulationAssetProps } from './EvmTxSimulationAssetTypes';

export const EvmTxSimulationWrappedAsset = ({
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

        {assetDiff?.in.map((inAmount, inIndex) => (
            <HStack
                key={`in-${inIndex}`}
                spacing="sp12"
                alignItems="center"
                flex={1}
                flexWrap="wrap"
            >
                <EvmTxSimulationAssetAmount
                    fiatAmount={
                        inAmount.usd_price
                            ? asBaseCurrencyAmount(new BigNumber(inAmount.usd_price))
                            : undefined
                    }
                    fiatSign="+ "
                    summary={inAmount.summary}
                    summaryColor="contentBrand"
                />
            </HStack>
        ))}
        {assetDiff?.out.map((outAmount, outIndex) => (
            <HStack
                key={`out-${outIndex}`}
                spacing="sp12"
                alignItems="center"
                flex={1}
                flexWrap="wrap"
            >
                <EvmTxSimulationAssetAmount
                    fiatAmount={
                        outAmount.usd_price
                            ? asBaseCurrencyAmount(new BigNumber(outAmount.usd_price))
                            : undefined
                    }
                    fiatSign="- "
                    summary={outAmount.summary}
                    summaryColor="contentCritical"
                />
            </HStack>
        ))}
        {assetExposure?.spenders &&
            Object.values(assetExposure.spenders).map((spender, index) => (
                <HStack key={`spender-${index}`} spacing="sp12" alignItems="center" flex={1}>
                    <EvmTxSimulationAssetAmount
                        fiatAmount={spender.exposure.usd_price}
                        summary={spender.summary}
                        summaryColor="contentSecondary"
                    />
                </HStack>
            ))}
    </HStack>
);
