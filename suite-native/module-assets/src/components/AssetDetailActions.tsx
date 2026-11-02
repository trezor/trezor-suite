import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetHasSpendableBalance,
    selectWalletAssetKey,
    selectWalletAssetName,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { buildGlobalReceiveAssetOption } from '@suite-common/receive';
import { Box, Button, HStack, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    AssetsStackParamList,
    AssetsStackRoutes.AssetDetail,
    RootStackParamList
>;

export const AssetDetailActions = () => {
    const navigation = useNavigation<NavigationProps>();
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const assetName = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetName(state, assetKey),
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const hasSpendableBalance = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetHasSpendableBalance(state, assetKey),
    );

    const handleReceivePress = () => {
        if (assetName === undefined) {
            return;
        }

        const asset = buildGlobalReceiveAssetOption({
            symbol: networkSymbol,
            contractAddress: tokenContract,
            tokenSymbol,
            name: assetName,
        });

        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccounts,
            params: {
                asset,
                closeActionType: 'back',
            },
        });
    };

    const handleSendPress = () => {
        navigation.navigate(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
            params: {
                networksFilter: [networkSymbol],
            },
        });
    };

    return (
        <Box>
            <ScreenFooterGradient />
            <HStack spacing="sp12" paddingHorizontal="sp20" paddingTop="sp8" paddingBottom="sp16">
                <Button
                    flex={1}
                    iconRight="arrowLineDown"
                    onPress={handleReceivePress}
                    testID="@assets/asset-detail/receive-button"
                >
                    <Translation id="transactions.receive" />
                </Button>
                {hasSpendableBalance && (
                    <Button
                        flex={1}
                        priority="secondary"
                        iconRight="arrowLineUp"
                        onPress={handleSendPress}
                        testID="@assets/asset-detail/send-button"
                    >
                        <Translation id="transactions.send" />
                    </Button>
                )}
            </HStack>
        </Box>
    );
};
