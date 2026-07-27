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

    // NOTE: we know for certain that in order to create a passphrase wallet the useEmptyPassphrase === false
    const defaultLabel: string =
        device.useEmptyPassphrase === false
            ? translationString('TR_PASSPHRASE_WALLET', {
                  id: device.walletNumber,
              })
            : translationString('TR_NO_PASSPHRASE_WALLET');

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
