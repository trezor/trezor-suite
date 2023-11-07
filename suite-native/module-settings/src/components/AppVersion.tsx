import { S } from '@mobily/ts-belt';

import { Text, Box, HStack } from '@suite-native/atoms';
import { getBuildVersionNumber } from '@suite-native/config';
import { getSuiteVersion, getCommitHash } from '@trezor/env-utils';

import { ProductionDebug } from './ProductionDebug';

export const AppVersion = () => {
    const hasVersionAndBuildInfo =
        S.isNotEmpty(getSuiteVersion()) && S.isNotEmpty(getBuildVersionNumber());

    const hasCommitHash = S.isNotEmpty(getCommitHash());
    return (
        <HStack marginHorizontal="m" justifyContent="space-between">
            <Box>
                {hasVersionAndBuildInfo && (
                    <Text variant="hint" color="textDisabled">
                        Version: {`${getSuiteVersion()} (${getBuildVersionNumber()})`}
                    </Text>
                )}
            </Box>
            <ProductionDebug>
                {hasCommitHash && (
                    <Text variant="hint" color="textDisabled">
                        Last commit hash: {getCommitHash()}
                    </Text>
                )}
            </ProductionDebug>
        </HStack>
    );
};
