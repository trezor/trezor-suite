import { CommonActions } from '@react-navigation/native';

import {
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';

import { OnboardingButtons } from '../components/OnboardingButtons';
import { TradingLocationSettings } from '../components/TradingLocationSettings';

export type TradingLocationModalScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingLocationModal
>;

export const TradingLocationModalScreen = ({ navigation }: TradingLocationModalScreenProps) => {
    const resetToHome = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: { screen: HomeStackRoutes.Home },
                    },
                ],
            }),
        );
    };

    return (
        <Screen>
            <TradingLocationSettings context="onboarding">
                <OnboardingButtons afterPress={resetToHome} />
            </TradingLocationSettings>
        </Screen>
    );
};
