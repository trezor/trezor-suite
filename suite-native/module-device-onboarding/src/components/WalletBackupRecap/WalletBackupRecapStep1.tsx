import { SharedValue } from 'react-native-reanimated';

import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { WalletBackupRecapListItem } from './WalletBackupRecapListItem';
import { WALLET_BACKUP_RECAP_STEPS, walletBackupSecuritySteps } from './presets';
import { SwipeableWalkthroughStep } from '../SwipeableWalkthrough/SwipeableWalkthroughStep';

export type WalletBackupTutorialNumberedStepProps = {
    currentStepIndex: SharedValue<number>;
};

const containerStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const WalletBackupRecapStep1 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <SwipeableWalkthroughStep
            totalSteps={WALLET_BACKUP_RECAP_STEPS}
            callout={
                <Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step1.callout" />
            }
            title={<Translation id="moduleDeviceOnboarding.walletBackupRecapScreen.step1.title" />}
            currentStepIndex={currentStepIndex}
        >
            <VStack flex={1} marginTop="sp32" spacing="sp32" style={applyStyle(containerStyle)}>
                {walletBackupSecuritySteps.map((item, index) => {
                    const isLast = walletBackupSecuritySteps.length - 1 === index;

                    return (
                        <WalletBackupRecapListItem {...item} isLast={isLast} key={item.labelId} />
                    );
                })}
            </VStack>
        </SwipeableWalkthroughStep>
    );
};
