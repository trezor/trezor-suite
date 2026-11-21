import { type ReactNode, useState } from 'react';

import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { type TranslationKey, useTranslation } from '@suite/intl';

import { useFirmwareUpgradeModal } from '#src/hooks/suite/useFirmwareUpgradeModal';

export type TronFirmwareUpgradeModal = {
    /** Opens the modal for the flow named by `featureName`. */
    openFirmwareModal: (featureName: TranslationKey) => void;
    /** A dialog the modal opens over yields Escape and its backdrop to it while this holds. */
    isFirmwareModalOpen: boolean;
    firmwareModal: ReactNode;
};

// A Tron control that firmware withholds stays enabled and asks for the update instead.
export const useTronFirmwareUpgradeModal = (): TronFirmwareUpgradeModal => {
    const [featureName, setFeatureName] = useState<TranslationKey | null>(null);

    const { translationString } = useTranslation();

    const { isFirmwareModalOpen, openFirmwareModal, closeFirmwareModal, updateFirmware } =
        useFirmwareUpgradeModal();

    const openForFeature = (name: TranslationKey) => {
        setFeatureName(name);
        openFirmwareModal();
    };

    const firmwareModal =
        isFirmwareModalOpen && featureName !== null ? (
            <FirmwareUpgradeNeededModal
                onClose={closeFirmwareModal}
                onUpdate={updateFirmware}
                featureName={translationString(featureName)}
            />
        ) : null;

    return { openFirmwareModal: openForFeature, isFirmwareModalOpen, firmwareModal };
};
