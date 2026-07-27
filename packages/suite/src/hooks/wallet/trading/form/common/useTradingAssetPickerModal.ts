import { useCallback } from 'react';

import { useDevice } from '@suite/device';
import { openModal } from '@suite/modal';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';

import { setConnectionModal } from 'src/actions/device/deviceSlice';
import { useModal } from 'src/components/suite/asset-picker/hooks';
import { useDispatch, useSelector } from 'src/hooks/suite';

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

        if (!device?.connected) {
            dispatch(setConnectionModal(true));

            return;
        }

        openAssetPicker();
    }, [dispatch, hasEnabledNetworks, device?.connected, openAssetPicker]);

    return { open, openModal: handleOpenModal, closeModal, toggleModal } as const;
};
