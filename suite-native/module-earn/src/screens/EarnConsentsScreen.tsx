import { useState } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EarnConsentsDelegatingCard } from '../components/EarnConsentsDelegatingCard';
import { EarnConsentsEntryPeriodCard } from '../components/EarnConsentsEntryPeriodCard';

const titleStyle = prepareNativeStyle(() => ({
    fontSize: 34,
    marginBottom: 44,
}));

export const EarnConsentsScreen = () => {
    const { applyStyle } = useNativeStyles();
    const [isSecondCardExpanded, setIsSecondCardExpanded] = useState(false);

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack marginTop="sp32" spacing="sp16">
                <Text variant="headline-md" style={applyStyle(titleStyle)}>
                    <Translation id="earn.earnConsentsScreen.title" />
                </Text>
                <EarnConsentsEntryPeriodCard onConfirm={() => setIsSecondCardExpanded(true)} />
                <EarnConsentsDelegatingCard isExpanded={isSecondCardExpanded} />
            </VStack>
        </Screen>
    );
};
