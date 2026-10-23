import { useSelector } from 'react-redux';

import { selectSmallBalanceSummary } from '@suite-common/assets';
import { selectAreHomeAssetSmallBalancesShown } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Divider, HStack, PressableOpacity, Switch, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

type PortfolioAssetsSmallBalancesSwitchProps = {
    onChange: (areShown: boolean) => void;
};

export const PortfolioAssetsSmallBalancesSwitch = ({
    onChange,
}: PortfolioAssetsSmallBalancesSwitchProps) => {
    const smallBalances = useSelector(selectSmallBalanceSummary);
    const areSmallBalancesShown = useSelector(selectAreHomeAssetSmallBalancesShown);

    if (smallBalances === undefined) {
        return null;
    }

    const toggle = () => onChange(!areSmallBalancesShown);

    return (
        <>
            <Divider />
            <PressableOpacity
                onPress={toggle}
                accessibilityRole="switch"
                accessibilityState={{ checked: areSmallBalancesShown }}
                testID="@home/portfolio-assets/view-options/small-balances"
            >
                <HStack
                    alignItems="center"
                    spacing="sp12"
                    paddingHorizontal="sp4"
                    paddingVertical="sp12"
                >
                    <VStack flex={1} spacing="sp2">
                        <Text variant="body-sm">
                            <Translation id="moduleHome.assets.viewOptionsSheet.showSmallBalances" />
                        </Text>
                        <HStack alignItems="center" spacing={0}>
                            <Text variant="body-xs" color="contentSecondary">
                                <Translation
                                    id="moduleHome.assets.viewOptionsSheet.smallBalancesSummary"
                                    values={{ count: smallBalances.assetCount }}
                                />
                                {' · '}
                            </Text>
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(smallBalances.fiatValue)}
                                variant="body-xs"
                                color="contentSecondary"
                            />
                        </HStack>
                    </VStack>
                    <Switch isChecked={areSmallBalancesShown} onChange={toggle} />
                </HStack>
            </PressableOpacity>
        </>
    );
};
