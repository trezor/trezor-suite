import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { BlurUrls, Box, Text, type TextProps } from '@suite-native/atoms';

type EvmTxSimulationAssetAmountProps = {
    fiatAmount?: BaseCurrencyAmount;
    fiatSign?: ReactNode;
    summary?: ReactNode;
    summaryColor: TextProps['color'];
};

export const EvmTxSimulationAssetAmount = ({
    fiatAmount,
    fiatSign,
    summary,
    summaryColor,
}: EvmTxSimulationAssetAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <>
            <Box flex={1}>
                {/* Simulated assets have no metadata to vouch for them, so URLs are masked. */}
                {typeof summary === 'string' ? (
                    <BlurUrls text={summary} color={summaryColor} />
                ) : (
                    <Text color={summaryColor}>{summary}</Text>
                )}
            </Box>
            {!!fiatAmount && (
                <Text color="contentSecondary">
                    {fiatSign}
                    <BaseCurrencyAmountFormatter value={fiatAmount} currency="USD" />
                </Text>
            )}
        </>
    );
};
