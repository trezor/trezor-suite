import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type SuiteSyncDataRootState, selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { parseAccountKey, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Badge, Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import {
    type RootStackParamList,
    type RootStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

type TokenAccountDetailScreenHeaderProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const TokenAccountDetailScreenHeader = ({
    accountKey,
    tokenContract,
}: TokenAccountDetailScreenHeaderProps) => {
    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
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
            closeActionType={closeActionType}
        />
    );
};
