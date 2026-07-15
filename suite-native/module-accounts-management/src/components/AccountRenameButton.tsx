import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { BottomSheetModal, Box, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectIsLabellingAllowed } from '@suite-native/labeling';
import { useTurnOnSuiteSyncGuard } from '@suite-native/suite-sync';

import { AccountRenameForm } from './AccountRenameForm';

type AccountRenameModalProps = {
    accountKey: AccountKey;
};

export const AccountRenameButton = ({ accountKey }: AccountRenameModalProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { handleAddLabel, isInProgress } = useTurnOnSuiteSyncGuard();

    const handleTriggerAccountRename = () => {
        if (isLabellingAllowed) {
            handleAddLabel(openModal);
        } else {
            /*
             This flow edits the legacy MMKV labelling. It is reached by connecting T1B1 or T2T1 with Suite Sync turned off.
             Only Account labels were implemented in the legacy system, that's why other labelling UI is simply hidden in this case.
             Note that labels created/edited this way will be overidden by Suite Sync, if it is turned on on the same wallet.
            */
            openModal();
        }
    };

    return (
        <Box>
            <IconButton
                intent="neutral"
                priority="secondary"
                iconName="pencilSimple"
                size="medium"
                onPress={handleTriggerAccountRename}
                testID="@account-detail/settings/edit-button"
                isLoading={isInProgress}
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
