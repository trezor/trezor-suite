import { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutDown } from 'react-native-reanimated';

import { Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

import { firmwareTitlesWrapperStyle } from './FirmwareInstallationProgressTitles';

const ANIMATION_DURATION = 1000;

const FACTS_TRANSLATION_KEYS: TxKeyPath[] = [
    'firmware.firmwareUpdateProgress.trezorFacts.1',
    'firmware.firmwareUpdateProgress.trezorFacts.2',
    'firmware.firmwareUpdateProgress.trezorFacts.3',
    'firmware.firmwareUpdateProgress.trezorFacts.4',
    'firmware.firmwareUpdateProgress.trezorFacts.5',
    'firmware.firmwareUpdateProgress.trezorFacts.6',
    'firmware.firmwareUpdateProgress.trezorFacts.7',
    'firmware.firmwareUpdateProgress.trezorFacts.8',
    'firmware.firmwareUpdateProgress.trezorFacts.9',
    'firmware.firmwareUpdateProgress.trezorFacts.10',
    'firmware.firmwareUpdateProgress.trezorFacts.11',
];
const FACTS_COUNT = FACTS_TRANSLATION_KEYS.length;

// Randomly shuffle facts, so it do not always start with the same fact
const SHUFFLED_FACTS_TRANSLATION_KEYS = FACTS_TRANSLATION_KEYS.sort(() => Math.random() - 0.5);

export const TrezorFacts = () => {
    const { applyStyle } = useNativeStyles();
    const [factIndex, setFactIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setFactIndex(prev => (prev + 1) % FACTS_COUNT), 10_000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={applyStyle(firmwareTitlesWrapperStyle)}
        >
            <VStack spacing="sp8">
                <Text variant="body-sm-strong" textAlign="center">
                    <Translation id="firmware.firmwareUpdateProgress.trezorFacts.title" />
                </Text>
                <Animated.View
                    key={factIndex}
                    entering={FadeIn.delay(ANIMATION_DURATION).duration(ANIMATION_DURATION)}
                    exiting={FadeOut.duration(ANIMATION_DURATION)}
                >
                    <Text variant="headline-sm" textAlign="center">
                        <Translation
                            id={
                                SHUFFLED_FACTS_TRANSLATION_KEYS[factIndex] ??
                                'firmware.firmwareUpdateProgress.trezorFacts.1'
                            }
                        />
                    </Text>
                </Animated.View>
            </VStack>
        </Animated.View>
    );
};
