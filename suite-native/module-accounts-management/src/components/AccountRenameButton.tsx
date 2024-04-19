import { useState } from 'react';

import { Box, BottomSheet, IconButton } from '@suite-native/atoms';

import { AccountRenameForm } from './AccountRenameForm';

type AccountRenameModalProps = {
    accountKey: string;
};

export const AccountRenameButton = ({ accountKey }: AccountRenameModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleOpen = () => setIsVisible(true);
    const handleClose = () => setIsVisible(false);

    return (
        <Box>
            <IconButton
                colorScheme="tertiaryElevation0"
                iconName="pencil"
                onPress={handleOpen}
                testID="@account-detail/settings/edit-button"
            />
            <BottomSheet title="Rename coin" isVisible={isVisible} onClose={handleClose}>
                <AccountRenameForm accountKey={accountKey} onSubmit={handleClose} />
            </BottomSheet>
        </Box>
    );
};
