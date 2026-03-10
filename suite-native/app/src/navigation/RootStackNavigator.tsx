import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { isDevelopOrDebugEnv } from '@suite-native/config';
import { BootloaderModeScreen } from '@suite-native/device-bootloader-mode';
import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import {
    AccountDetailScreen,
    AccountSettingsScreen,
} from '@suite-native/module-accounts-management';
import { AddCoinAccountStackNavigator } from '@suite-native/module-add-accounts';
import { DeviceCompromisedModalScreen } from '@suite-native/module-authenticity-checks';
import { AuthorizeDeviceStackNavigator } from '@suite-native/module-authorize-device';
import {
    ConnectPermissionsScreen,
    ConnectPopupScreen,
    WalletConnectPairScreen,
    WalletConnectSessionPopupScreen,
    WalletConnectSwitchAccountScreen,
} from '@suite-native/module-connect-popup';
import { DemoAccountQuestionnaireStackNavigator } from '@suite-native/module-demo-account-questionnaire';
import { DevUtilsStackNavigator } from '@suite-native/module-dev-utils';
import {
    BackupFailedModalScreen,
    DeviceOnboardingStackNavigator,
} from '@suite-native/module-device-onboarding';
import { DeviceSettingsStackNavigator } from '@suite-native/module-device-settings';
import {
    EarnConsentsScreen,
    EarnFormScreen,
    HowStakeWorksScreen,
    StakingDetailScreen,
} from '@suite-native/module-earn';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';
import { PassphraseStackNavigator } from '@suite-native/module-passphrase';
import { SendStackNavigator } from '@suite-native/module-send';
import { SettingsStackNavigator } from '@suite-native/module-settings';
import { StellarManageTokenStackNavigator } from '@suite-native/module-stellar-token-management';
import { TransactionDetailStackNavigator } from '@suite-native/module-transactions';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { ReceiveStackNavigator } from '@suite-native/receive';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { StorybookUI } from '@suite-native/storybook';
import { TradingLocationModalScreen } from '@suite-native/trading-residence';
import { selectShouldDisplayTradingResidenceOnboarding } from '@suite-native/trading-state';

import { AppTabNavigator } from './AppTabNavigator';
import { NavigatorLayoutWithGlobalHooks } from './RootStackNavigatorGlobalHooksWrapper';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const shouldDisplayTradingResidenceOnboarding = useSelector(
        selectShouldDisplayTradingResidenceOnboarding,
    );

    const getInitialRouteName = () => {
        if (!isOnboardingFinished) {
            return RootStackRoutes.OnboardingStack;
        }

        if (shouldDisplayTradingResidenceOnboarding) {
            return RootStackRoutes.TradingLocationModal;
        }

        return RootStackRoutes.AppTabs;
    };

    return (
        <RootStack.Navigator
            layout={NavigatorLayoutWithGlobalHooks}
            initialRouteName={getInitialRouteName()}
            screenOptions={stackNavigationOptionsConfig}
        >
            <RootStack.Screen
                name={RootStackRoutes.OnboardingStack}
                component={OnboardingStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.AppTabs} component={AppTabNavigator} />
            <RootStack.Screen
                options={{ title: RootStackRoutes.AccountSettings }}
                name={RootStackRoutes.AccountSettings}
                component={AccountSettingsScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.TransactionDetailStack}
                component={TransactionDetailStackNavigator}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.AccountDetail }}
                name={RootStackRoutes.AccountDetail}
                component={AccountDetailScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.StakingDetail }}
                name={RootStackRoutes.StakingDetail}
                component={StakingDetailScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.HowStakeWorksScreen }}
                name={RootStackRoutes.HowStakeWorksScreen}
                component={HowStakeWorksScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.EarnForm }}
                name={RootStackRoutes.EarnForm}
                component={EarnFormScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.EarnConsents }}
                name={RootStackRoutes.EarnConsents}
                component={EarnConsentsScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.DevUtilsStack}
                component={DevUtilsStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.ConnectPopup} component={ConnectPopupScreen} />
            <RootStack.Screen
                name={RootStackRoutes.WalletConnectSessionPopup}
                component={WalletConnectSessionPopupScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.WalletConnectSwitchAccount}
                component={WalletConnectSwitchAccountScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.WalletConnectPair}
                component={WalletConnectPairScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.ConnectPermissions}
                component={ConnectPermissionsScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.SettingsScreenStack}
                component={SettingsStackNavigator}
            />
            <RootStack.Screen
                name={RootStackRoutes.DemoAccountQuestionnaireStack}
                component={DemoAccountQuestionnaireStackNavigator}
            />
            <RootStack.Screen
                name={RootStackRoutes.DeviceCompromisedModal}
                component={DeviceCompromisedModalScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.BackupFailedModal}
                component={BackupFailedModalScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.BootloaderMode}
                component={BootloaderModeScreen}
            />
            {/* Navigation flows that start by push from bottom animation on the first screen of its stack. */}
            <RootStack.Group screenOptions={{ animation: 'slide_from_bottom' }}>
                <RootStack.Screen
                    name={RootStackRoutes.DeviceOnboardingStack}
                    component={DeviceOnboardingStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.AccountsImport}
                    component={AccountsImportStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.AddCoinAccountStack}
                    component={AddCoinAccountStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.ReceiveStack}
                    component={ReceiveStackNavigator}
                />
                <RootStack.Screen name={RootStackRoutes.SendStack} component={SendStackNavigator} />
                <RootStack.Screen
                    name={RootStackRoutes.DeviceSettingsStack}
                    component={DeviceSettingsStackNavigator}
                />
                <RootStack.Screen
                    name={RootStackRoutes.AuthorizeDeviceStack}
                    component={AuthorizeDeviceStackNavigator}
                    options={{
                        gestureEnabled: false,
                    }}
                />
                <RootStack.Screen
                    name={RootStackRoutes.PassphraseStack}
                    component={PassphraseStackNavigator}
                    options={{
                        gestureEnabled: false,
                    }}
                />
                <RootStack.Screen
                    name={RootStackRoutes.TradingLocationModal}
                    component={TradingLocationModalScreen}
                />
                <RootStack.Screen
                    name={RootStackRoutes.StellarManageTokenStack}
                    component={StellarManageTokenStackNavigator}
                />

                {isDevelopOrDebugEnv() && (
                    <RootStack.Screen
                        name={RootStackRoutes.Storybook}
                        component={StorybookUI}
                        options={{
                            headerShown: true,
                            headerBackButtonDisplayMode: 'minimal',
                        }}
                    />
                )}
            </RootStack.Group>
        </RootStack.Navigator>
    );
};
