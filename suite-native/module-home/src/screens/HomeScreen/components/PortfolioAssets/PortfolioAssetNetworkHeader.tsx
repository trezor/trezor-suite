import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectNetworkFiatValue,
    selectNetworkName,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { BigNumber } from '@trezor/utils';

type PortfolioAssetNetworkHeaderProps = {
    symbol: NetworkSymbol;
};

export const PortfolioAssetNetworkHeader = ({ symbol }: PortfolioAssetNetworkHeaderProps) => {
    const name = useSelector((state: HomeAssetTableState) => selectNetworkName(state, symbol));
    const fiatValue = useSelector((state: HomeAssetTableState) =>
        selectNetworkFiatValue(state, symbol),
    );

    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            spacing="sp8"
            paddingHorizontal="sp20"
            paddingTop="sp16"
            paddingBottom="sp4"
            testID={`@home/portfolio-assets/network/${symbol}`}
        >
            <Text variant="body-xs" color="contentSecondary" numberOfLines={1}>
                {name ?? symbol.toUpperCase()}
            </Text>
            {fiatValue !== undefined && (
                <BaseCurrencyAmountFormatter
                    value={asBaseCurrencyAmount(new BigNumber(fiatValue))}
                    variant="body-xs"
                    color="contentSecondary"
                />
            )}
        </HStack>
    );
};
