import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Text, type TextProps } from '@suite-native/atoms';

type EvmTxSimulationAssetAmountProps = {
    fiatAmount?: BaseCurrencyAmount;
    fiatSign?: ReactNode;
    summary?: string;
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
                <Text color={summaryColor}>{summary}</Text>
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
