import React from 'react';

import { Card, VStack } from '@suite-native/atoms';

import { CopyLogsButton } from './CopyLogsButton';
import { BuildInfo } from './BuildInfo';

export const ProductionDevInfo = () => (
    <Card>
        <VStack spacing="medium">
            <CopyLogsButton />
            <BuildInfo />
        </VStack>
    </Card>
);
