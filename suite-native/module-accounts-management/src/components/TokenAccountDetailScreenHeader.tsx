import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type SuiteSyncDataRootState, selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { Badge, Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { type RootStackParamList, RootStackRoutes, ScreenHeader } from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { parseStaticSessionId } from '@trezor/device-utils';

import { selectAssetTabOfAccountToken } from '../selectors';
import { TokenScreenHeaderSettings } from './TokenScreenHeaderSettings';

type TokenAccountDetailScreenHeaderProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const TokenAccountDetailScreenHeader = ({
    accountKey,
    tokenContract,
}: TokenAccountDetailScreenHeaderProps) => {
    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);
    const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, accountKey),
    );
    const accountLabel =
        useSelector((state: AccountsRootState & SuiteSyncDataRootState) =>
            selectSuiteSyncAccountLabel(state, walletDescriptor, accountDescriptor, networkSymbol),
        ) ??
        account?.accountLabel ??
        '';

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const tokenTab = useSelector(
        (state: TokensRootState & FiatRatesRootState & WalletSettingsRootState) =>
            selectAssetTabOfAccountToken(state, accountKey, tokenContract),
    );

    const handleGoBack = useCallback(() => {
        const isAccountAssetsInStack = navigation
            .getState()
            .routes.some(stackRoute => stackRoute.name === RootStackRoutes.AccountAssets);

        if (isAccountAssetsInStack) {
            navigation.popTo(RootStackRoutes.AccountAssets, {
                accountKey,
                tab: tokenTab,
            });
        } else {
            navigation.goBack();
        }
    }, [navigation, accountKey, tokenTab]);

    if (!symbol) {
        return null;
    }

    return (
        <ScreenHeader
            customContent={
                <Box alignItems="center">
                    <HStack alignItems="center">
                        <CryptoIconWithNetwork
                            symbol={symbol}
                            contractAddress={tokenContract}
                            size="small"
                        />
                        <VStack spacing={0}>
                            <Text ellipsizeMode="tail" numberOfLines={1}>
                                {token?.name}
                            </Text>

                            <HStack alignItems="center" spacing="sp4">
                                <Text
                                    variant="body-xs"
                                    color="contentSecondary"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {accountLabel}
                                </Text>

                                {formattedAccountType && (
                                    <Badge label={formattedAccountType} size="small" />
                                )}
                            </HStack>
                        </VStack>
                    </HStack>
                </Box>
            }
            rightIcon={
                <TokenScreenHeaderSettings accountKey={accountKey} tokenContract={tokenContract} />
            }
            closeActionType={closeActionType}
            closeAction={handleGoBack}
        />
    );
};
