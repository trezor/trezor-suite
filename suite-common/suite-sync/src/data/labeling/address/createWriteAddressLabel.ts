import { type WriteAddressLabel } from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';

import {
    type SuiteSyncAnalyticsDep,
    getLabelAction,
    reportLabelEvent,
} from '../../../suiteSyncAnalytics';

type GetAddressLabelDep = {
    getAddressLabel: (deviceStaticSessionId: StaticSessionId, address: string) => string | null;
};

export type WriteAddressLabelDeps = SuiteSyncAnalyticsDep & GetAddressLabelDep;

export const createWriteAddressLabel =
    (deps: WriteAddressLabelDeps): WriteAddressLabel =>
    ({
        storage,
        data: { deviceStaticSessionId, address, label, accountDescriptor, networkSymbol },
    }) => {
        const previousLabel = deps.getAddressLabel(deviceStaticSessionId, address);

        const result = storage.data.addresses.update({
            address,
            label,
            accountDescriptor,
            networkSymbol,
        });

        if (result.success && label) {
            reportLabelEvent(
                deps.analytics,
                'receive_address',
                networkSymbol,
                getLabelAction(previousLabel),
            );
        }

        return result;
    };
