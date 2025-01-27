import React from 'react';
import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    GoBackIcon,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    alignItems: 'center',
    gap: utils.spacings.sp8,
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
        <ScreenHeader
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
