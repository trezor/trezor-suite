import { useSelector } from 'react-redux';

import {
    WithLabelingState,
    selectAccountLabel as selectAccountLabelSuiteSync,
} from '@suite-common/suite-sync';
import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { useIsLabelingEnabled } from '../components/useIsLabelingEnabled';

export const useAccountLabel = ({
    accountKey,
    deviceState,
}: {
    accountKey: Account['key'] | null;
    deviceState: Account['deviceState'] | null;
}) => {
    const isLabelingEnabled = useIsLabelingEnabled();

    const { walletDescriptor } = deviceState
        ? parseDeviceStaticSessionId(deviceState)
        : { walletDescriptor: null };

    const syncedLabel = useSelector((state: WithLabelingState) =>
        selectAccountLabelSuiteSync({ state, walletDescriptor, accountKey }),
    );

    const storeLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );

    return isLabelingEnabled && syncedLabel !== null ? syncedLabel : storeLabel;
};
