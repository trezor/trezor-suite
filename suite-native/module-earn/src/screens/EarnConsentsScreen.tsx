import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { events } from '@suite-native/analytics';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
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
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';

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
    const networkSymbol = account.symbol;

    const analytics = useAnalytics();
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.stakingStakeEvent.name,
        payload: {
            action: 'cancel',
            step: isSecondCardExpanded ? 'funds-maintained-modal' : 'entry-period-stake-modal',
            networkSymbol,
        },
    });

    const handleEntryPeriodConfirm = () => {
        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'entry-period-stake-modal',
                networkSymbol,
            },
        });
        setIsSecondCardExpanded(true);
    };

    const handleConfirm = () => {
        registerNavigateBackAnalytics();
        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'funds-maintained-modal',
                networkSymbol,
            },
        });
        navigation.navigate(RootStackRoutes.EarnTransactionDataReview, { accountKey, amount });
    };

    const entryPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectEntryPeriodInDaysBySymbol(state),
    );

    const learnMoreUrl = STAKING_LEARN_MORE_URLS[getNetwork(account.symbol).networkType];

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack marginTop="sp32" spacing="sp16">
                <Text variant="headline-md" style={applyStyle(titleStyle)}>
                    <Translation id="earn.earnConsentsScreen.title" />
                </Text>
                <EarnConsentsEntryPeriodCard
                    onConfirm={handleEntryPeriodConfirm}
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
