import React from 'react';

import {
    getEnv,
    getChangelog,
    getCommitHash,
    getAppVersion,
    getBuildVersionNumber,
} from '@suite-native/config';
import { ListItem } from '@suite-native/atoms';

export const BuildInfo = () => (
    <>
        <ListItem
            subtitle={`${getEnv()}-${getAppVersion()} (${getBuildVersionNumber()}), commit ${getCommitHash()}`}
            title="Build version"
        />
        <ListItem subtitle={getChangelog()} title="Changelog" />
    </>
);
