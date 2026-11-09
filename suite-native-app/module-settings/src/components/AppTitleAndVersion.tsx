import { S } from '@mobily/ts-belt';

import { Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { getSuiteVersion } from '@trezor/env-utils';

export const AppTitleAndVersion = () => {
    const version = getSuiteVersion();

    return (
        <VStack justifyContent="center" alignItems="center" marginBottom="sp24">
            <Icon name="trezorLogo" size="large" color="contentSecondary" />
            <Text variant="body-sm-strong" color="contentSecondary">
                <Translation id="generic.trezorSuite" />
            </Text>
            {S.isNotEmpty(version) && <Text color="contentSecondary">{version}</Text>}
        </VStack>
    );
};
