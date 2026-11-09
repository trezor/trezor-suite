import { S } from '@mobily/ts-belt';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getCommitHash } from '@trezor/env-utils';

import { ProductionDebug } from './ProductionDebug';

export const AppCommitHash = () => {
    const lastCommitHash = getCommitHash();
    if (S.isEmpty(lastCommitHash)) return null;

    return (
        <Box alignItems="center">
            <ProductionDebug>
                <Text variant="body-sm" color="contentDisabled">
                    <Translation
                        id="moduleSettings.aboutUs.lastCommitHash"
                        values={{ lastCommitHash }}
                    />
                </Text>
            </ProductionDebug>
        </Box>
    );
};
