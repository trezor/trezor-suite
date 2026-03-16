import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { BottomSheetModal, Box, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectIsLabellingAllowed, useTurnOnSuiteSyncGuard } from '@suite-native/labeling';

import { AccountRenameForm } from './AccountRenameForm';

type AccountRenameModalProps = {
    accountKey: AccountKey;
};

export const AccountRenameButton = ({ accountKey }: AccountRenameModalProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { handleAddLabel } = useTurnOnSuiteSyncGuard();

    const handleTriggerAccountRename = () => {
        if (isLabellingAllowed) {
            handleAddLabel(openModal);
        } else {
            openModal();
        }
    };

    return (
        <Box>
            <IconButton
                intent="neutral"
                priority="secondary"
                iconName="pencilSimple"
                onPress={handleTriggerAccountRename}
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
