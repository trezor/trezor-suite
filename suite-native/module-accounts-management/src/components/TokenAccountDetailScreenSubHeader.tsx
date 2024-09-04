import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import { Box, HStack, Text } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    ScreenSubHeader,
    GoBackIcon,
} from '@suite-native/navigation';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { CryptoIcon } from '@suite-common/icons-deprecated';
import { useTranslate } from '@suite-native/intl';

type TokenAccountDetailScreenHeaderProps = {
    accountKey: string;
    tokenName: string;
};

export const TokenAccountDetailScreenSubHeader = ({
    accountKey,
    tokenName,
}: TokenAccountDetailScreenHeaderProps) => {
    const { translate } = useTranslate();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    return (
        <ScreenSubHeader
            content={
                <Box alignItems="center">
                    <Text ellipsizeMode="tail" numberOfLines={1}>
                        {tokenName}
                    </Text>
                    <HStack spacing="extraSmall" alignItems="center">
                        <CryptoIcon symbol="eth" size="extraSmall" />
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
                    </HStack>
                </Box>
            }
            leftIcon={<GoBackIcon closeActionType={closeActionType} />}
        />
    );
};
