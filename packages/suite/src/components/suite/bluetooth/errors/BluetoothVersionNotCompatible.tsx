import { Text, NewModal, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

type BluetoothVersionNotCompatibleProps = {
    onCancel: () => void;
};

export const BluetoothVersionNotCompatible = ({ onCancel }: BluetoothVersionNotCompatibleProps) => (
    <NewModal
        onCancel={onCancel}
        variant="info"
        iconName="bluetooth"
        bottomContent={
            <>
                <NewModal.Button variant="tertiary" onClick={onCancel}>
                    Cancel
                </NewModal.Button>
            </>
        }
    >
        <Column alignItems="start" gap={spacings.xs}>
            <Text typographyStyle="titleSmall">
                Your computer’s bluetooth version is not compatible with whatever we’re using copy.
            </Text>
            <Text typographyStyle="body" variant="tertiary">
                Use cable, buy a 5.0+ dongle.
            </Text>
        </Column>
    </NewModal>
);
