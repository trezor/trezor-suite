import { useSelector } from 'react-redux';

import { useTranslation } from '@suite/intl';
import type { TrezorDevice } from '@suite-common/suite-types';

import { type SelectWalletLabelState, selectWalletLabel } from './selectWalletLabel';

type UseWalletLabelParams = {
    device: TrezorDevice;
    shouldUseDeviceLabel?: boolean;
};

export const useWalletLabel = ({ device, shouldUseDeviceLabel }: UseWalletLabelParams) => {
    const { translationString } = useTranslation();

    let defaultLabel: string | undefined;

    if (device.state?.staticSessionId) {
        if (device.useEmptyPassphrase) {
            defaultLabel = translationString('TR_NO_PASSPHRASE_WALLET');
        } else if (device.walletNumber) {
            defaultLabel = translationString('TR_PASSPHRASE_WALLET', {
                id: device.walletNumber,
            });
        }
    }

    const label =
        useSelector((state: SelectWalletLabelState) =>
            selectWalletLabel(state, {
                deviceStaticId: device.state?.staticSessionId ?? null,
            }),
        ) ??
        defaultLabel ??
        null;

    return {
        defaultLabel,
        label:
            shouldUseDeviceLabel && label
                ? `${device?.features?.label || device?.name || ''} ${label}`
                : label,
    };
};
