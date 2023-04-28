import React from 'react';
import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { Button, Card, VStack } from '@suite-native/atoms';

import { CopyLogsButton } from './CopyLogsButton';
import { BuildInfo } from './BuildInfo';

export const SentryTestErrorButton = () => (
    <Button
        onPress={() => {
            const errorMessage = `Sentry test error - ${Date.now()}`;
            Sentry.captureException(new Error(errorMessage));
            Alert.alert('Sentry error thrown', errorMessage);
        }}
    >
        Throw Sentry error
    </Button>
);

export const ProductionDevInfo = () => (
    <Card>
        <VStack spacing="medium">
            <CopyLogsButton />
            <SentryTestErrorButton />
            <BuildInfo />
        </VStack>
    </Card>
);
