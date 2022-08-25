import { NavigatorScreenParams } from '@react-navigation/native';

import { OnboardingStackParamList } from '@suite-native/module-onboarding';

export enum HomeStackRoutes {
    Home = 'Home',
    Import = 'Import',
}

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: NavigatorScreenParams<OnboardingStackParamList>;
    [HomeStackRoutes.Import]: undefined;
};
