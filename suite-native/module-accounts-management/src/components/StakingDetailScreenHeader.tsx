import React from 'react';

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
import { Icon } from '@suite-common/icons';

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    alignItems: 'center',
    gap: utils.spacings.small,
}));

const headerTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

type AccountDetailScreenHeaderProps = {
    accountLabel: string | null;
};

export const StakingDetailScreenHeader = ({ accountLabel }: AccountDetailScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

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
                            <Translation id="accountList.staking" />
                        </Text>
                    </HStack>
                    <Text variant="hint" color="textSubdued">
                        {accountLabel}
                    </Text>
                </>
            }
            leftIcon={<GoBackIcon closeActionType={closeActionType} />}
        />
    );
};
