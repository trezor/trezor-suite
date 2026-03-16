import { TextButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { FirmwareChangelog } from './FirmwareChangelog';

export const FirmwareChangelogButton = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <TextButton
                iconLeft="question"
                intent="neutral"
                priority="secondary"
                size="small"
                isUnderlined
                onPress={openModal}
            >
                <Translation id="firmware.changelog.button" />
            </TextButton>
            <FirmwareChangelog ref={bottomSheetRef} onClose={closeModal} />
        </>
    );
};
