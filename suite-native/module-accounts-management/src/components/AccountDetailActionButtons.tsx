import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, Button, HStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import {
    selectHasAccountOrTokenSpendableBalance,
    selectIsNetworkSendFlowEnabled,
} from '../selectors';

type AccountDetailActionButtonsProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

export const AccountDetailActionButtons = ({
    accountKey,
    tokenContract,
}: AccountDetailActionButtonsProps) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProp>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );
    const isNetworkSendFlowEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsNetworkSendFlowEnabled(state, account?.symbol),
    );
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );
    const hasSelectedAssetSpendableBalance = useSelector(
        (state: AccountsRootState & TokensRootState) =>
            selectHasAccountOrTokenSpendableBalance(state, accountKey, tokenContract),
    );

    if (!account) return null;

    const handleReceive = () => {
        analytics.report({
            type: events.receiveFlowEnteredEvent.name,
            payload: {
                location: 'accountDetail',
                assetSymbol: account.symbol,
                tokenSymbol: token?.symbol,
                tokenContract,
            },
        });
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAddress,
            params: {
                accountKey,
                tokenContract,
                closeActionType: 'close',
            },
        });
    };

    const handleSend = () => {
        analytics.report({
            type: events.sendFlowEnteredEvent.name,
            payload: {
                location: 'accountDetail',
                assetSymbol: account.symbol,
                tokenSymbol: token?.symbol,
                tokenContract,
            },
        });
        navigation.navigate(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendOutputs,
            params: {
                accountKey,
                tokenContract,
            },
        });
    };

    const isReceiveButtonDisplayed = !hasFirmwareAuthenticityCheckHardFailed;
    const isSendButtonDisplayed =
        isNetworkSendFlowEnabled && !isPortfolioTrackerDevice && hasSelectedAssetSpendableBalance;

    if (!isReceiveButtonDisplayed && !isSendButtonDisplayed) return null;

    return (
        <HStack flex={1} spacing="sp12">
            {isReceiveButtonDisplayed && (
                <Box flex={1}>
                    <Button
                        iconLeft="arrowLineDown"
                        onPress={handleReceive}
                        testID="@account-detail/receive-button"
                    >
                        <Translation id="transactions.receive" />
                    </Button>
                </Box>
            )}
            {isSendButtonDisplayed && (
                <Box flex={1}>
                    <Button
                        iconLeft="arrowLineUp"
                        onPress={handleSend}
                        testID="@account-detail/send-button"
                    >
                        <Translation id="transactions.send" />
                    </Button>
                </Box>
            )}
        </HStack>
    );
};
