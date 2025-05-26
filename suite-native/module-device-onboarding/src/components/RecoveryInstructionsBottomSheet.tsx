import { forwardRef } from 'react';

import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useNavigation } from '@react-navigation/native';

import {
    BottomSheetModal,
    Box,
    BulletListItem,
    Button,
    CardWithIconLayout,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads,
    RootStackParamList
>;

const RECOVERY_ISSUES_LINK =
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/trezor-recovery-issues#lost-wallet-backup';

export const RecoveryInstructionsBottomSheet = forwardRef<BottomSheetModalMethods>(
    (_props, ref) => {
        const navigation = useNavigation<NavigationProps>();

        const openLink = useOpenLink();

        const handleLearnMorePress = () => {
            openLink(RECOVERY_ISSUES_LINK);
        };

        const handleSetUpPress = () => {
            navigation.pop();
            navigation.navigate(DeviceOnboardingStackRoutes.CreateWalletLoading);
        };

        return (
            <BottomSheetModal
                ref={ref}
                title={
                    <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.title" />
                }
                isCloseDisplayed
            >
                <VStack marginVertical="sp16" spacing="sp16">
                    <CardWithIconLayout
                        icon="question"
                        title={
                            <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card1.title" />
                        }
                    >
                        <VStack marginTop="sp2" spacing="sp16">
                            <Text variant="body" color="textSubdued">
                                <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card1.paragraph1" />
                            </Text>
                            <Button
                                colorScheme="tertiaryElevation0"
                                onPress={handleLearnMorePress}
                                viewLeft="arrowSquareOut"
                            >
                                <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card1.cta" />
                            </Button>
                        </VStack>
                    </CardWithIconLayout>
                    <CardWithIconLayout
                        icon="bank"
                        title={
                            <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.title" />
                        }
                    >
                        <VStack marginTop="sp2" spacing="sp16">
                            <VStack spacing="sp16">
                                <Text variant="body" color="textSubdued">
                                    <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.paragraph1" />
                                </Text>
                                <Box>
                                    <Text variant="body" color="textSubdued">
                                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.paragraph2" />
                                    </Text>
                                    <BulletListItem variant="body" color="textSubdued">
                                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.bullets.1" />
                                    </BulletListItem>
                                    <BulletListItem variant="body" color="textSubdued">
                                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.bullets.2" />
                                    </BulletListItem>
                                    <BulletListItem variant="body" color="textSubdued">
                                        <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.bullets.3" />
                                    </BulletListItem>
                                </Box>
                            </VStack>
                            <Button onPress={handleSetUpPress}>
                                <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.bottomSheet.card2.cta" />
                            </Button>
                        </VStack>
                    </CardWithIconLayout>
                </VStack>
            </BottomSheetModal>
        );
    },
);
