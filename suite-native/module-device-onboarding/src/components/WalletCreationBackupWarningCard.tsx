import { useMemo, useState } from 'react';
import { LinearTransition, runOnJS } from 'react-native-reanimated';

import { AnimatedCard, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const warningCardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderOnElevation0,
    ...utils.boxShadows.none,
}));

export const WalletCreationBackupWarningCard = () => {
    const { applyStyle } = useNativeStyles();
    const [isLayoutAnimationFinished, setIsLayoutAnimationFinished] = useState(false);

    const layoutAnimation = useMemo(() => {
        if (isLayoutAnimationFinished) {
            return undefined;
        }

        return LinearTransition.withCallback(() => {
            runOnJS(setIsLayoutAnimationFinished)(true);
        });
    }, [isLayoutAnimationFinished]);

    return (
        <AnimatedCard style={applyStyle(warningCardStyle)} layout={layoutAnimation}>
            <VStack alignItems="center">
                <Icon name="cameraSlash" size="extraLarge" color="iconSubdued" />
                <Text color="textSubdued" textAlign="center">
                    <Translation id="moduleDeviceOnboarding.walletCreationScreen.backupWarning" />
                </Text>
            </VStack>
        </AnimatedCard>
    );
};
