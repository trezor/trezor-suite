import React from 'react';

import { Button, Card, VStack } from "@suite-native/atoms";

import { CopyLogsButton } from './CopyLogsButton';
import { BuildInfo } from './BuildInfo';
import { clearStorage } from "@suite-native/storage";

export const ProductionDevInfo = () => (
    <Card>
        <VStack spacing="medium">
            <Button onPress={clearStorage}>Clear storage</Button>
            <CopyLogsButton />
            <BuildInfo />
        </VStack>
    </Card>
);
