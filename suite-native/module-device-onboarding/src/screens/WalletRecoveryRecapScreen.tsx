import { useSharedValue } from 'react-native-reanimated';

import { SwipeableWalkthrough, SwipeableWalkthroughScreenHeader } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { WalletBackupRecapBackButton } from '../components/WalletBackupRecap/WalletBackupRecapBackButton';
import {
    WALLET_RECOVERY_RECAP_STEPS,
    WalletRecoveryRecapStep1,
} from '../components/WalletBackupRecap/recovery/WalletRecoveryRecapStep1';
import { WalletRecoveryRecapStep2 } from '../components/WalletBackupRecap/recovery/WalletRecoveryRecapStep2';
import { useExitAlert } from '../hooks/useExitAlert';

export const WalletRecoveryRecapScreen = () => {
    const currentStepIndex = useSharedValue(0);
    const { handleExitButtonPress } = useExitAlert();

    return (
        <Screen
            header={
                <SwipeableWalkthroughScreenHeader
                    currentStepIndex={currentStepIndex}
                    CustomBackButton={WalletBackupRecapBackButton}
                    onPressBack={handleExitButtonPress}
                />
            }
            isScrollable={false}
            noHorizontalPadding
        >
            <SwipeableWalkthrough
                currentStepIndex={currentStepIndex}
                totalSteps={WALLET_RECOVERY_RECAP_STEPS}
            >
                <WalletRecoveryRecapStep1 currentStepIndex={currentStepIndex} />
                <WalletRecoveryRecapStep2 currentStepIndex={currentStepIndex} />
            </SwipeableWalkthrough>
        </Screen>
    );
};
