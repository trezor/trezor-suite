import { S } from '@mobily/ts-belt';

import { Box, Text } from '@suite-native/atoms';
import { getCommitHash } from '@trezor/env-utils';

import { ProductionDebug } from './ProductionDebug';

export const AppCommitHash = () => {
    if (S.isEmpty(getCommitHash())) return null;

    return (
        <Box alignItems="center">
            <ProductionDebug>
                <Text variant="hint" color="textDisabled">
                    Last commit hash: {getCommitHash().slice(0, 7)}
                </Text>
            </ProductionDebug>
        </Box>
    );
};
