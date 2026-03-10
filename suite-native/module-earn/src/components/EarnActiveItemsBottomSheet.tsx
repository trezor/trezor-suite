import { useCallback, useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { selectAPYByAccountKey, useSelector as useStakingSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';
import { type EarnDepositsCardActiveItem } from '../types';

const itemCardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const rowStyle = prepareNativeStyle(utils => ({
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const valuesStyle = prepareNativeStyle(utils => ({
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

type EarnActiveItemCardProps = {
    item: EarnDepositsCardActiveItem;
    onPress: () => void;
};

const formatActiveItemBalance = (item: EarnDepositsCardActiveItem) => {
    const maxDecimals = item.type === 'staking' ? CRYPTO_BALANCE_DECIMALS : 2;
    const balanceValue = Number(item.balance);
    const formattedValue = Number.isNaN(balanceValue)
        ? item.balance
        : balanceValue.toLocaleString(undefined, {
              maximumFractionDigits: maxDecimals,
          });

    return `${formattedValue} ${item.type === 'staking' ? item.symbol.toUpperCase() : item.tokenSymbol}`;
};

const EarnActiveItemCard = ({ item, onPress }: EarnActiveItemCardProps) => {
    const { applyStyle } = useNativeStyles();
    const isStakingItem = item.type === 'staking';

    const stakingApy = useStakingSelector(state =>
        isStakingItem ? selectAPYByAccountKey(state, item.accountKey) : null,
    );

    const apyValue = isStakingItem ? (stakingApy ?? item.apy) : item.apy;
    const apyText = apyValue === null ? null : `${apyValue}% APY`;
    const symbol = isStakingItem ? item.symbol : item.networkSymbol;
    const contractAddress = isStakingItem ? undefined : item.contractAddress;
    const secondaryDescription = isStakingItem
        ? apyText
        : getNetworkDisplaySymbolName(item.networkSymbol);

    return (
        <Card borderColor="borderElevation1" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={onPress} style={applyStyle(rowStyle)}>
                <Box marginRight="sp12">
                    <CryptoIconWithNetwork
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size="extraSmall"
                    />
                </Box>

                <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                    <Text>{item.title}</Text>
                    {!isStakingItem && (
                        <Text variant="body-sm" color="textSecondaryHighlight">
                            {secondaryDescription}
                        </Text>
                    )}
                    {isStakingItem && apyText !== null && (
                        <Text variant="body-sm" color="textSecondaryHighlight">
                            {apyText}
                        </Text>
                    )}
                </VStack>

                <VStack spacing="sp2" style={applyStyle(valuesStyle)}>
                    <Text variant="body-md">{formatActiveItemBalance(item)}</Text>
                    {isStakingItem ? (
                        <BaseCurrencyAmountFormatter
                            value={item.fiatAmount}
                            variant="body-sm"
                            color="textSubdued"
                            isDiscreetText={false}
                        />
                    ) : (
                        apyText !== null && (
                            <Text variant="body-sm" color="textSecondaryHighlight">
                                {apyText}
                            </Text>
                        )
                    )}
                </VStack>

                <Box marginLeft="sp12">
                    <Icon name="caretRight" size="mediumLarge" color="iconSubdued" />
                </Box>
            </PressableOpacity>
        </Card>
    );
};

type EarnActiveItemsBottomSheetProps = {
    ref: BottomSheetModalRef;
    type: EarnDepositsCardActiveItem['type'];
    items: EarnDepositsCardActiveItem[];
    onClose: () => void;
};

export const EarnActiveItemsBottomSheet = ({
    ref,
    type,
    items,
    onClose,
}: EarnActiveItemsBottomSheetProps) => {
    const navigation = useNavigation<NavigationProp>();

    const title = useMemo(
        () =>
            type === 'staking' ? (
                <Translation id="earn.earnScreen.activeSheet.stakingTitle" />
            ) : (
                <Translation id="earn.earnScreen.activeSheet.stablecoinYieldTitle" />
            ),
        [type],
    );

    const handlePress = useCallback(
        (item: EarnDepositsCardActiveItem) => {
            onClose();

            switch (item.type) {
                case 'staking':
                    navigation.navigate(RootStackRoutes.StakingManagement, {
                        accountKey: item.accountKey,
                    });
                    break;
                case 'stablecoin-yield':
                    navigation.navigate(RootStackRoutes.AccountDetail, {
                        accountKey: item.accountKey,
                        tokenContract: item.contractAddress,
                        closeActionType: 'back',
                    });
                    break;
            }
        },
        [navigation, onClose],
    );

    const renderItem = useCallback(
        ({ item }: { item: EarnDepositsCardActiveItem }) => (
            <EarnActiveItemCard item={item} onPress={() => handlePress(item)} />
        ),
        [handlePress],
    );

    return (
        <BottomSheetModal ref={ref} title={title} isCloseDisplayed onClose={onClose}>
            <Box paddingTop="sp16">
                <FlashList
                    data={items}
                    keyExtractor={item => item.id}
                    getItemType={item => item.type}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
