import React from 'react';

import {
    getEnv,
    getChangelog,
    getCommitHash,
    getAppVersion,
    getBuildVersionNumber,
} from '@suite-native/config';
import { ListItem, VStack } from '@suite-native/atoms';

export const BuildInfo = () => (
    <VStack spacing="medium">
        <ListItem
            subtitle={`${getEnv()}-${getAppVersion()} (${getBuildVersionNumber()}), commit ${getCommitHash()}`}
            title="Build version"
        />
        <ListItem subtitle={getChangelog()} title="Changelog" />
    </VStack>
);
