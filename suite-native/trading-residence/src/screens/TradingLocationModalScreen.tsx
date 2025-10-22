import { CommonActions } from '@react-navigation/native';

import {
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';

import { OnboardingButtons } from '../components/OnboardingButtons';
import { TradingLocationSettings } from '../components/TradingLocationSettings';

export type TradingLocationModalScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingLocationModal
>;

export const TradingLocationModalScreen = ({ navigation }: TradingLocationModalScreenProps) => (
    <Screen>
        <TradingLocationSettings context="onboarding">
            <OnboardingButtons
                afterPress={() => {
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
                }}
            />
        </TradingLocationSettings>
    </Screen>
);
