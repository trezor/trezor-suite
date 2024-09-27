import React from 'react';
import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import { HStack, Text } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    ScreenSubHeader,
    GoBackIcon,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons-deprecated';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    alignItems: 'center',
    gap: utils.spacings.small,
}));

const headerTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const StakingDetailScreenHeader = () => {
    const { applyStyle } = useNativeStyles();

    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingDetail>>();
    const { accountKey } = route.params;

    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    return (
        <ScreenSubHeader
            content={
                <>
                    <HStack style={applyStyle(headerStyle)}>
                        <Icon name="piggyBankFilled" color="iconSubdued" />
                        <Text
                            variant="highlight"
                            ellipsizeMode="tail"
                            numberOfLines={1}
                            style={applyStyle(headerTextStyle)}
                        >
                            <Translation id="staking.stakingDetailScreen.title" />
                        </Text>
                    </HStack>
                    <Text variant="hint" color="textSubdued">
                        {accountLabel}
                    </Text>
                </>
            }
            leftIcon={<GoBackIcon closeActionType="back" />}
        />
    );
};
