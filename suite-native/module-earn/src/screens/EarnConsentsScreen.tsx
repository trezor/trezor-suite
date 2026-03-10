import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectEntryPeriodInDaysBySymbol,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
    type Url,
} from '@trezor/urls';

import { EarnConsentsDelegatingCard } from '../components/EarnConsentsDelegatingCard';
import { EarnConsentsEntryPeriodCard } from '../components/EarnConsentsEntryPeriodCard';

const STAKING_LEARN_MORE_URLS: Partial<Record<string, Url>> = {
    ethereum: HELP_CENTER_ETH_STAKING,
    solana: HELP_CENTER_SOL_STAKING,
    cardano: HELP_CENTER_ADA_STAKING,
};

const titleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp44,
}));

export const EarnConsentsScreen = () => {
    const { applyStyle } = useNativeStyles();
    const [isSecondCardExpanded, setIsSecondCardExpanded] = useState(false);
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.EarnConsents>>();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.EarnConsents>>();
    const { accountKey, amount, account } = route.params;

    const handleConfirm = () => {
        navigation.navigate(RootStackRoutes.EarnTransactionDataReview, { accountKey, amount });
    };

    const entryPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectEntryPeriodInDaysBySymbol(state, account.symbol),
    );

    const learnMoreUrl = STAKING_LEARN_MORE_URLS[getNetwork(account.symbol).networkType];

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack marginTop="sp32" spacing="sp16">
                <Text variant="headline-md" style={applyStyle(titleStyle)}>
                    <Translation id="earn.earnConsentsScreen.title" />
                </Text>
                <EarnConsentsEntryPeriodCard
                    onConfirm={() => setIsSecondCardExpanded(true)}
                    entryPeriodInDays={entryPeriodInDays}
                    learnMoreUrl={learnMoreUrl}
                />
                <EarnConsentsDelegatingCard
                    isExpanded={isSecondCardExpanded}
                    symbol={account.symbol}
                    onConfirm={handleConfirm}
                />
            </VStack>
        </Screen>
    );
};
