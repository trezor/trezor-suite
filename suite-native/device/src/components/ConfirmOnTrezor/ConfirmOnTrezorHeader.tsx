import { HStack, IconButton, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, ScreenHeaderProps } from '@suite-native/navigation';

import { ConfirmOnTrezorIndicator } from './ConfirmOnTrezorIndicator';

type ConfirmOnTrezorHeaderProps = ScreenHeaderProps & {
    onToggleSheet: () => void;
};
export const ConfirmOnTrezorHeader = ({
    onToggleSheet,
    closeAction = undefined,
    closeActionType = 'back',
}: ConfirmOnTrezorHeaderProps) => (
    <ScreenHeader
        closeAction={closeAction}
        closeActionType={closeActionType}
        customContent={
            <HStack alignItems="center">
                <Text variant="highlight">
                    <Translation id="device.continueOnTrezor.headerTitle" />
                </Text>
                <ConfirmOnTrezorIndicator />
            </HStack>
        }
        rightIcon={
            <IconButton
                colorScheme="tertiaryElevation0"
                iconName="caretUpDown"
                onPress={onToggleSheet}
            />
        }
    />
);
