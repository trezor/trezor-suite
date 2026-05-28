import { useSelector } from 'react-redux';

import type { TrezorDevice } from '@suite-common/suite-types';

import { type SelectWalletLabelState, selectWalletLabel } from './selectWalletLabel';
import { useGetDefaultWalletLabel } from './useGetDefaultWalletLabel';

type UseGetWalletLabelParams = {
    device: TrezorDevice;
    shouldUseDeviceLabel?: boolean;
};

export const useGetWalletLabel = ({ device, shouldUseDeviceLabel }: UseGetWalletLabelParams) => {
    const defaultWalletLabel = useGetDefaultWalletLabel({ device });

    const walletLabel = useSelector((state: SelectWalletLabelState) =>
        selectWalletLabel(state, {
            deviceStaticId: device.state?.staticSessionId ?? null,
        }),
    );

    const label = walletLabel ?? defaultWalletLabel;

    if (shouldUseDeviceLabel) {
        const deviceLabel = device?.features?.label || device?.name || '';

        return `${deviceLabel} ${label}`;
    }

    if (!label) {
        return null;
    }

    return label;
};
