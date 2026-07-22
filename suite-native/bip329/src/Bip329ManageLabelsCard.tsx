import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { Box, CardWithIconLayout, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type StaticSessionId } from '@trezor/device-utils';

import { Bip329ExportButton } from './Bip329ExportButton';
import { Bip329ImportButton } from './Bip329ImportButton';

type Bip329ManageLabelsCardProps = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
};

export const Bip329ManageLabelsCard = ({
    accountDescriptor,
    networkSymbol,
    deviceStaticSessionId,
}: Bip329ManageLabelsCardProps) => (
    <CardWithIconLayout
        icon="fileArrowDown"
        title={<Translation id="moduleAccounts.accountSettingsBip329.title" />}
    >
        <VStack marginTop="sp2" spacing="sp16">
            <Text variant="body-sm" color="contentSecondary" adjustsFontSizeToFit numberOfLines={3}>
                <Translation id="moduleAccounts.accountSettingsBip329.description" />
            </Text>
            <HStack spacing="sp12">
                <Box flex={1}>
                    <Bip329ImportButton
                        accountDescriptor={accountDescriptor}
                        deviceStaticSessionId={deviceStaticSessionId}
                    />
                </Box>
                <Box flex={1}>
                    <Bip329ExportButton
                        accountDescriptor={accountDescriptor}
                        networkSymbol={networkSymbol}
                        deviceStaticSessionId={deviceStaticSessionId}
                    />
                </Box>
            </HStack>
        </VStack>
    </CardWithIconLayout>
);
