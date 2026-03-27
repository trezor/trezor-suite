import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { Button, CardWithIconLayout, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ExportBip329BottomSheet } from '@suite-native/labeling';
import { type StaticSessionId } from '@trezor/connect';

type AccountSettingsExportBip329CardProps = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
};

export const AccountSettingsExportBip329Card = ({
    accountDescriptor,
    networkSymbol,
    deviceStaticSessionId,
}: AccountSettingsExportBip329CardProps) => {
    const {
        bottomSheetRef: ExportBip329BottomSheetRef,
        openModal: openBip329Modal,
        closeModal: closeBip329Sheet,
    } = useBottomSheetModal();

    return (
        <CardWithIconLayout
            icon="fileArrowDown"
            title={<Translation id="moduleAccounts.accountSettingsExportBip329Button.title" />}
        >
            <VStack marginTop="sp2" spacing="sp16">
                <Text variant="body-sm" adjustsFontSizeToFit numberOfLines={3}>
                    <Translation id="moduleAccounts.accountSettingsExportBip329Button.description" />
                </Text>
                <Button size="small" onPress={openBip329Modal} colorScheme="tertiaryElevation0">
                    <Translation id="moduleAccounts.accountSettingsExportBip329Button.button" />
                </Button>
            </VStack>
            <ExportBip329BottomSheet
                ref={ExportBip329BottomSheetRef}
                accountDescriptor={accountDescriptor}
                networkSymbol={networkSymbol}
                deviceStaticSessionId={deviceStaticSessionId}
                onClose={closeBip329Sheet}
            />
        </CardWithIconLayout>
    );
};
