import { S } from '@mobily/ts-belt';

import { Text, Box, HStack } from '@suite-native/atoms';
import { getSuiteVersion, getCommitHash } from '@trezor/env-utils';

import { ProductionDebug } from './ProductionDebug';

export const AppVersion = () => (
    <HStack marginHorizontal="medium" justifyContent="space-between">
        <Box>
            {S.isNotEmpty(getSuiteVersion()) && (
                <Text variant="hint" color="textDisabled">
                    Version: {`${getSuiteVersion()}`}
                </Text>
            )}
        </Box>
        <ProductionDebug>
            {S.isNotEmpty(getCommitHash()) && (
                <Text variant="hint" color="textDisabled">
                    Last commit hash: {getCommitHash().slice(-7)}
                </Text>
            )}
        </ProductionDebug>
    </HStack>
);
