import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import type { TrezorDevice } from '@suite-common/suite-types';

type UseGetDefaultWalletLabelParams = {
    device: TrezorDevice;
};

export const useGetDefaultWalletLabel = ({ device }: UseGetDefaultWalletLabelParams) => {
    const { translationString } = useTranslation();

    return useMemo(() => {
        if (!device.state?.staticSessionId) {
            return undefined;
        }

        if (device.useEmptyPassphrase) {
            return translationString('TR_NO_PASSPHRASE_WALLET');
        }

        if (!device.walletNumber) {
            return undefined;
        }

        return translationString('TR_PASSPHRASE_WALLET', { id: device.walletNumber });
    }, [device, translationString]);
};
