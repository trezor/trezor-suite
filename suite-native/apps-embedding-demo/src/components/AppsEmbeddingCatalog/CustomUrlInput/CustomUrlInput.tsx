import { useState } from 'react';

import { Button, InlineAlertText, Input, VStack } from '@suite-native/atoms';
import { type HttpsUrl } from '@trezor/type-utils';

import { parseCustomUrl } from './utils/parseCustomUrl';

type CustomUrlInputProps = {
    onSubmit: (url: HttpsUrl) => void;
};

export const CustomUrlInput = ({ onSubmit }: CustomUrlInputProps) => {
    const [value, setValue] = useState('');
    const [isInvalid, setIsInvalid] = useState(false);

    const handleChangeText = (text: string) => {
        setValue(text);
        setIsInvalid(false);
    };

    const handleSubmit = () => {
        const url = parseCustomUrl(value);

        if (url === null) {
            setIsInvalid(true);

            return;
        }

        onSubmit(url);
    };

    return (
        <VStack spacing="sp8">
            <Input
                label="Custom URL"
                value={value}
                onChangeText={handleChangeText}
                hasError={isInvalid}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                testID="@dev-utils/apps-embedding/custom-url-input"
            />
            {isInvalid && (
                <InlineAlertText variant="critical">
                    Only https URLs can be opened, e.g. https://example.com.
                </InlineAlertText>
            )}
            <Button
                intent="neutral"
                priority="secondary"
                isDisabled={value.trim().length === 0}
                onPress={handleSubmit}
                testID="@dev-utils/apps-embedding/embed-custom-url"
            >
                Embed URL
            </Button>
        </VStack>
    );
};
