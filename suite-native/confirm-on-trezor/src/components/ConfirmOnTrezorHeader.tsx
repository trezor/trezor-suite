import { useMemo } from 'react';

import { HStack, IconButton, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, type ScreenHeaderProps } from '@suite-native/navigation';

import { ConfirmOnTrezorIndicator } from './ConfirmOnTrezorIndicator';

type ConfirmOnTrezorHeaderProps = ScreenHeaderProps & {
    onToggleSheet: () => void;
    isCloseButtonDisabled?: boolean;
};
export const ConfirmOnTrezorHeader = ({
    onToggleSheet,
    closeAction = undefined,
    closeActionType = 'back',
    isCloseButtonDisabled = false,
}: ConfirmOnTrezorHeaderProps) => {
    const backButtonProps = useMemo(
        () => (isCloseButtonDisabled ? { closeActionType: undefined, leftIcon: <></> } : {}),
        [isCloseButtonDisabled],
    );

    return (
        <ScreenHeader
            closeAction={closeAction}
            closeActionType={closeActionType}
            customContent={
                <HStack alignItems="center">
                    <Text variant="body-md-strong">
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
            {...backButtonProps}
        />
    );
};
