import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { setConnectionModal, useDevice } from '@suite/device';
import { openModal } from '@suite/modal';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';

import { useModal } from 'src/components/suite/asset-picker/hooks';
import { useSelector } from 'src/hooks/suite';

export const useTradingAssetPickerModal = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { open, openModal: openAssetPicker, closeModal, toggleModal } = useModal();
    const hasEnabledNetworks = useSelector(selectIsAnyNetworkEnabled);

    const handleOpenModal = useCallback(() => {
        if (!hasEnabledNetworks) {
            dispatch(openModal({ type: 'activate-assets' }));

            return;
        }

        if (!device?.state?.staticSessionId) {
            dispatch(setConnectionModal(true));

            return;
        }

        openAssetPicker();
    }, [dispatch, hasEnabledNetworks, device?.state?.staticSessionId, openAssetPicker]);

    return { open, openModal: handleOpenModal, closeModal, toggleModal } as const;
};
