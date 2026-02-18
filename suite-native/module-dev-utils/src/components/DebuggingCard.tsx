import { Alert } from 'react-native';

import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { captureSentryException } from '@suite-native/sentry';

import { RenderingUtils } from './RenderingUtils';

export const DebuggingCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="headline-sm">Debugging</Text>
            {isDevelopOrDebugEnv() && <RenderingUtils />}
            <VStack>
                <Button
                    onPress={() => {
                        const errorMessage = `Sentry test error - ${Date.now()}`;
                        captureSentryException(new Error(errorMessage));
                        Alert.alert('Sentry error thrown', errorMessage);
                    }}
                >
                    Throw Sentry error
                </Button>
            </VStack>
        </VStack>
    </Card>
);
