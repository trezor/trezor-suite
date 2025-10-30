import { useState } from 'react';

import { useAtom } from 'jotai';

import { analytics, customAnalyticsUrlAtom } from '@suite-native/analytics';
import { Button, Input, Text, VStack } from '@suite-native/atoms';

export const AnalyticsUrlControl = () => {
    const [customAnalyticsUrl, setCustomAnalyticsUrl] = useAtom(customAnalyticsUrlAtom);
    const [inputValue, setInputValue] = useState(customAnalyticsUrl || '');

    const handleSaveUrl = () => {
        const trimmedUrl = inputValue.trim();
        if (trimmedUrl) {
            setCustomAnalyticsUrl(trimmedUrl);
            analytics.setUrl(trimmedUrl);
        }
    };

    const handleResetUrl = () => {
        setInputValue('');
        setCustomAnalyticsUrl(undefined);
        analytics.setUrl(undefined as any);
    };

    return (
        <VStack spacing="sp8">
            <Text variant="highlight">Analytics URL</Text>
            <Input
                label="Custom Analytics URL"
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <VStack spacing="sp8">
                <Button size="small" colorScheme="tertiaryElevation0" onPress={handleSaveUrl}>
                    Set Custom URL
                </Button>
                {customAnalyticsUrl && (
                    <Button size="small" colorScheme="redBold" onPress={handleResetUrl}>
                        Reset to Default
                    </Button>
                )}
            </VStack>
            {customAnalyticsUrl && <Text variant="hint">Current: {customAnalyticsUrl}</Text>}
        </VStack>
    );
};
