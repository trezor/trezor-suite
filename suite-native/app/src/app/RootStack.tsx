import { Stack } from 'expo-router';

import { isDevelopOrDebugEnv } from '@suite-native/config';
import { RootStackRoutes, stackNavigationOptionsConfig } from '@suite-native/navigation';

import { NavigatorLayoutWithGlobalHooks } from '../navigation/RootStackNavigatorGlobalHooksWrapper';

const slideFromBottomOptions = {
    animation: 'slide_from_bottom',
} as const;

export const RootStack = () => {
    const isStorybookEnabled = isDevelopOrDebugEnv();

    return (
        <Stack
            layout={NavigatorLayoutWithGlobalHooks}
            initialRouteName="index"
            screenOptions={stackNavigationOptionsConfig}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name={RootStackRoutes.OnboardingStack} />
            <Stack.Screen name={RootStackRoutes.AppTabs} />
            <Stack.Screen
                options={{ title: RootStackRoutes.AccountSettings }}
                name={RootStackRoutes.AccountSettings}
            />
            <Stack.Screen name={RootStackRoutes.TransactionDetailStack} />
            <Stack.Screen
                options={{ title: RootStackRoutes.AccountAssets }}
                name={RootStackRoutes.AccountAssets}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.AccountDetail }}
                name={RootStackRoutes.AccountDetail}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.StakingDetail }}
                name={RootStackRoutes.StakingDetail}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.StakingManagement }}
                name={RootStackRoutes.StakingManagement}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.StakingInsufficientBalance }}
                name={RootStackRoutes.StakingInsufficientBalance}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.UnstakeFlow }}
                name={RootStackRoutes.UnstakeFlow}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.HowStakeWorksScreen }}
                name={RootStackRoutes.HowStakeWorksScreen}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.YieldNavigator }}
                name={RootStackRoutes.YieldNavigator}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.EarnForm }}
                name={RootStackRoutes.EarnForm}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.EarnConsents }}
                name={RootStackRoutes.EarnConsents}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.EarnTransactionDataReview }}
                name={RootStackRoutes.EarnTransactionDataReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.UnstakeTransactionDataReview }}
                name={RootStackRoutes.UnstakeTransactionDataReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.ClaimReview }}
                name={RootStackRoutes.ClaimReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.ClaimTransactionDataReview }}
                name={RootStackRoutes.ClaimTransactionDataReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangePreview }}
                name={RootStackRoutes.TradingExchangePreview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangeApproval }}
                name={RootStackRoutes.TradingExchangeApproval}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangeRevoke }}
                name={RootStackRoutes.TradingExchangeRevoke}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingSellPreview }}
                name={RootStackRoutes.TradingSellPreview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingConfirming }}
                name={RootStackRoutes.TradingConfirming}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingSellOutputsReview }}
                name={RootStackRoutes.TradingSellOutputsReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangeOutputsReview }}
                name={RootStackRoutes.TradingExchangeOutputsReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.ReceiveAccounts }}
                name={RootStackRoutes.ReceiveAccounts}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingHistory }}
                name={RootStackRoutes.TradingHistory}
            />
            <Stack.Screen name={RootStackRoutes.DevUtils} />
            <Stack.Screen name={RootStackRoutes.ConnectPopup} />
            <Stack.Screen name={RootStackRoutes.WalletConnectSessionPopup} />
            <Stack.Screen name={RootStackRoutes.WalletConnectSwitchAccount} />
            <Stack.Screen name={RootStackRoutes.WalletConnectPair} />
            <Stack.Screen name={RootStackRoutes.ConnectPermissions} />
            <Stack.Screen name={RootStackRoutes.SettingsScreenStack} />
            <Stack.Screen name={RootStackRoutes.DemoAccountQuestionnaireStack} />
            <Stack.Screen name={RootStackRoutes.DeviceCompromisedModal} />
            <Stack.Screen name={RootStackRoutes.BackupFailedModal} />
            <Stack.Screen name={RootStackRoutes.BootloaderMode} />
            <Stack.Screen
                name={RootStackRoutes.DeviceOnboardingStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen name={RootStackRoutes.AccountsImport} options={slideFromBottomOptions} />
            <Stack.Screen
                name={RootStackRoutes.AddCoinAccountStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen name={RootStackRoutes.ReceiveStack} options={slideFromBottomOptions} />
            <Stack.Screen name={RootStackRoutes.SendStack} options={slideFromBottomOptions} />
            <Stack.Screen
                name={RootStackRoutes.DeviceSettingsStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.AuthorizeDeviceStack}
                options={{ ...slideFromBottomOptions, gestureEnabled: false }}
            />
            <Stack.Screen
                name={RootStackRoutes.PassphraseStack}
                options={{ ...slideFromBottomOptions, gestureEnabled: false }}
            />
            <Stack.Screen
                name={RootStackRoutes.TradingLocationModal}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.StellarManageTokenStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.FeatureFeedbackModal}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.Storybook}
                redirect={!isStorybookEnabled}
                options={{
                    ...slideFromBottomOptions,
                    headerShown: true,
                    headerBackButtonDisplayMode: 'minimal',
                }}
            />
        </Stack>
    );
};
