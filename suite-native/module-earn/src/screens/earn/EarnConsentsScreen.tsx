import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { earnOnboardingActions, getEarnOpportunityKey } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnConsentsDelegatingCard } from '../../components/earn/EarnConsentsDelegatingCard';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';

const titleStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp44,
}));

export const EarnConsentsScreen = () => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.EarnConsents>>();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.EarnConsents>>();
    const { accountKey, amount, account } = route.params;
    const networkSymbol = account.symbol;

    const { analytics, dispatch } = useServices(selectNativeAnalyticsDep, selectDispatch);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.stakingStakeEvent.name,
        payload: {
            action: 'cancel',
            step: 'funds-maintained-modal',
            networkSymbol,
        },
    });

    const handleConfirm = () => {
        dispatch(
            earnOnboardingActions.confirmEarnOnboarding({
                accountKey,
                opportunity: getEarnOpportunityKey({ type: 'staking', provider: 'everstake' }),
            }),
        );
        registerNavigateBackAnalytics();

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'funds-maintained-modal',
                networkSymbol,
            },
        });

        navigation.navigate(RootStackRoutes.StakingTransactionDataReview, {
            stakeType: 'stake',
            accountKey,
            amount,
        });
    };

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack marginTop="sp32" spacing="sp16">
                <Text variant="headline-md" style={applyStyle(titleStyle)}>
                    <Translation id="earn.earnConsentsScreen.title" />
                </Text>
                <EarnConsentsDelegatingCard symbol={account.symbol} onConfirm={handleConfirm} />
            </VStack>
        </Screen>
    );
};
