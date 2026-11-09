import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAccounts,
    selectWalletAssetKey,
    selectWalletAssetName,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { buildGlobalReceiveAssetOption } from '@suite-common/receive';
import {
    type NativeAccountsWithNetworksRootState,
    selectFilteredDeviceAccountListRows,
} from '@suite-native/accounts';
import { Box, Button, HStack, ScreenFooterGradient } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
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
    const assetAccounts = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccounts(state, assetKey),
    );
    const sendableAccountRows = useSelector((state: NativeAccountsWithNetworksRootState) =>
        selectFilteredDeviceAccountListRows(state, '', true, [networkSymbol], tokenContract),
    );
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    const singleAccountKey = assetAccounts.length === 1 ? assetAccounts[0]?.key : undefined;
    const singleSendAccountKey =
        sendableAccountRows.length === 1 ? sendableAccountRows[0]?.accountKey : undefined;

    const handleReceivePress = () => {
        if (assetName === undefined) {
            return;
        }

        if (singleAccountKey !== undefined) {
            navigation.navigate(RootStackRoutes.ReceiveStack, {
                screen: ReceiveStackRoutes.ReceiveAddress,
                params: {
                    accountKey: singleAccountKey,
                    tokenContract,
                    closeActionType: 'back',
                },
            });

            return;
        }

        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccounts,
            params: {
                asset: buildGlobalReceiveAssetOption({
                    symbol: networkSymbol,
                    contractAddress: tokenContract,
                    tokenSymbol,
                    name: assetName,
                }),
                closeActionType: 'back',
            },
        });
    };

    const handleSendPress = () => {
        if (singleSendAccountKey !== undefined) {
            navigation.navigate(RootStackRoutes.SendStack, {
                screen: SendStackRoutes.SendOutputs,
                params: {
                    accountKey: singleSendAccountKey,
                    tokenContract,
                },
            });

            return;
        }

        navigation.navigate(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
            params: {
                asset: { networkSymbol, tokenContract },
            },
        });
    };

    const isReceiveButtonDisplayed = !hasFirmwareAuthenticityCheckHardFailed;
    const isSendButtonDisplayed = !isPortfolioTrackerDevice && sendableAccountRows.length > 0;

    if (!isReceiveButtonDisplayed && !isSendButtonDisplayed) return null;

    return (
        <Box>
            <ScreenFooterGradient />
            <HStack spacing="sp12" paddingHorizontal="sp20" paddingTop="sp8" paddingBottom="sp16">
                {isReceiveButtonDisplayed && (
                    <Button
                        flex={1}
                        iconRight="arrowLineDown"
                        onPress={handleReceivePress}
                        testID="@assets/asset-detail/receive-button"
                    >
                        <Translation id="transactions.receive" />
                    </Button>
                )}
                {isSendButtonDisplayed && (
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
