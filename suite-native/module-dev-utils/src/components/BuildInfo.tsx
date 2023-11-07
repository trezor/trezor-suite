import { getEnv, getChangelog, getBuildVersionNumber } from '@suite-native/config';
import { getSuiteVersion, getCommitHash } from '@trezor/env-utils';
import { ListItem, VStack } from '@suite-native/atoms';

export const BuildInfo = () => (
    <VStack spacing="m">
        <ListItem
            subtitle={`${getEnv()}-${getSuiteVersion()} (${getBuildVersionNumber()}), commit ${getCommitHash()}`}
            title="Build version"
        />
        <ListItem subtitle={getChangelog()} title="Changelog" />
    </VStack>
);
