import { useSharedValue } from 'react-native-reanimated';

import { Screen } from '@suite-native/navigation';

import { SwipeableWalkthrough } from '../components/SwipeableWalkthrough/SwipeableWalkthrough';
import { SwipeableWalkthroughScreenHeader } from '../components/SwipeableWalkthrough/SwipeableWalkthroughScreenHeader';
import { WalletBackupRecapBackButton } from '../components/WalletBackupRecap/WalletBackupRecapBackButton';
import { WalletBackupRecapStep1 } from '../components/WalletBackupRecap/create/WalletBackupRecapStep1';
import { WalletBackupRecapStep2 } from '../components/WalletBackupRecap/create/WalletBackupRecapStep2';
import { WalletBackupRecapStep3 } from '../components/WalletBackupRecap/create/WalletBackupRecapStep3';
import { WalletBackupRecapStep4 } from '../components/WalletBackupRecap/create/WalletBackupRecapStep4';
import { WALLET_BACKUP_RECAP_STEPS } from '../components/WalletBackupRecap/create/presets';
import { useExitAlert } from '../hooks/useExitAlert';

export const WalletBackupRecapScreen = () => {
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
                totalSteps={WALLET_BACKUP_RECAP_STEPS}
            >
                <WalletBackupRecapStep1 currentStepIndex={currentStepIndex} />
                <WalletBackupRecapStep2 currentStepIndex={currentStepIndex} />
                <WalletBackupRecapStep3 currentStepIndex={currentStepIndex} />
                <WalletBackupRecapStep4 currentStepIndex={currentStepIndex} />
            </SwipeableWalkthrough>
        </Screen>
    );
};
