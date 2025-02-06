import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import {
    GoBackIcon,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

type TokenAccountDetailScreenHeaderProps = {
    accountKey: string;
    tokenContract: TokenAddress;
};

export const TokenAccountDetailScreenHeader = ({
    accountKey,
    tokenContract,
}: TokenAccountDetailScreenHeaderProps) => {
    const { translate } = useTranslate();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
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
            content={
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
                            <Text
                                variant="label"
                                color="textSubdued"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {translate('moduleAccounts.accountDetail.accountLabelBadge', {
                                    accountLabel,
                                })}
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            }
            leftIcon={<GoBackIcon closeActionType={closeActionType} />}
        />
    );
};
