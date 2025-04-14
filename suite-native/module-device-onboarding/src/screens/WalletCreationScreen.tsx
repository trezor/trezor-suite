import { useCallback, useEffect, useMemo, useState } from 'react';
import { LinearTransition, runOnJS } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { AnimatedCard, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage, createAndBackupWalletThunk } from '@suite-native/device';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { ERRORS } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { WalletCreationHint } from '../components/WalletCreationHint';

// Do not retry if user cancelled the flow via the app UI, or the Entropy check has failed
const DEFINITIVE_ERRORS: ERRORS.ErrorCode[] = ['Method_Interrupted', 'Failure_EntropyCheck'];

const SHOW_HINT_DELAY = 5000;

const warningCardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderWidth: 1,
    borderColor: utils.colors.borderOnElevation0,
    ...utils.boxShadows.none,
}));

export const WalletCreationScreen = ({
    navigation,
    route,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.WalletCreation>) => {
    const { walletBackupType } = route.params;
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const [isAccordionDisplayed, setIsAccordionDisplayed] = useState(false);

    const [isLayoutAnimationFinished, setIsLayoutAnimationFinished] = useState(false);

    const handleCreateAndBackupWallet = useCallback(async () => {
        const response = await dispatch(createAndBackupWalletThunk({ walletBackupType })).unwrap();

        if (response.success) {
            return navigation.navigate(DeviceOnboardingStackRoutes.WalletCreatedSuccess);
        }
        if (response.payload.code && DEFINITIVE_ERRORS.includes(response.payload.code)) return;

        handleCreateAndBackupWallet();
    }, [dispatch, walletBackupType, navigation]);

    useEffect(() => {
        handleCreateAndBackupWallet();
        const timeout = setTimeout(() => {
            setIsAccordionDisplayed(true);
        }, SHOW_HINT_DELAY);

        return () => clearTimeout(timeout);
    }, [handleCreateAndBackupWallet]);

    const layoutAnimation = useMemo(() => {
        if (isLayoutAnimationFinished) {
            return undefined;
        }

        return LinearTransition.withCallback(() => {
            runOnJS(setIsLayoutAnimationFinished)(true);
        });
    }, [isLayoutAnimationFinished]);

    return (
        <DeviceOnboardingScreenWithExitButton footer={<ConfirmOnTrezorImage />}>
            <VStack spacing="sp32" paddingTop="sp16">
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleDeviceOnboarding.walletCreationScreen.title" />
                </Text>
                <VStack spacing="sp16">
                    {isAccordionDisplayed && <WalletCreationHint />}
                    <AnimatedCard style={applyStyle(warningCardStyle)} layout={layoutAnimation}>
                        <VStack alignItems="center">
                            <Icon name="cameraSlash" />
                            <Text color="textSubdued" textAlign="center">
                                <Translation id="moduleDeviceOnboarding.walletCreationScreen.backupWarning" />
                            </Text>
                        </VStack>
                    </AnimatedCard>
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
