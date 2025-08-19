import { BottomSheetModal, Box, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AccountRenameForm } from './AccountRenameForm';

type AccountRenameModalProps = {
    accountKey: string;
};

export const AccountRenameButton = ({ accountKey }: AccountRenameModalProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <Box>
            <IconButton
                colorScheme="tertiaryElevation0"
                iconName="pencilSimple"
                onPress={openModal}
                testID="@account-detail/settings/edit-button"
            />
            <BottomSheetModal
                isCloseDisplayed
                ref={bottomSheetRef}
                title={
                    <Translation id="moduleAccountManagement.accountSettingsScreen.renameForm.title" />
                }
            >
                <AccountRenameForm accountKey={accountKey} onSubmit={closeModal} />
            </BottomSheetModal>
        </Box>
    );
};
