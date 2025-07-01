import { S } from '@mobily/ts-belt';

import { Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { getSuiteVersion } from '@trezor/env-utils';

export const AppTitleAndVersion = () => {
    const version = getSuiteVersion();

    return (
        <VStack justifyContent="center" alignItems="center" marginBottom="sp24">
            <Icon name="trezorLogo" size="large" color="iconSubdued" />
            <Text variant="callout" color="textSubdued">
                <Translation id="generic.trezorSuiteLite" />
            </Text>
            {S.isNotEmpty(version) && <Text color="textSubdued">{version}</Text>}
        </VStack>
    );
};
