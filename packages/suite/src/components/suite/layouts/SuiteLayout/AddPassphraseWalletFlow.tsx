import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import { type DiscoveryStatus } from '@suite-common/wallet-types';

import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { useSelector } from 'src/hooks/suite';

const HIDDEN_WALLET_TERMINAL_STATUSES: ReadonlySet<DiscoveryStatus['status']> = new Set([
    'cancelled',
    'failed',
    'complete',
]);

export const AddPassphraseWalletFlow = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state =>
        device?.path ? selectDiscoveryByDevicePath(state, device.path) : undefined,
    );

    const isActive =
        !!device &&
        discovery?.useScopedCallIds === true &&
        discovery?.isAddingHiddenWallet === true &&
        !HIDDEN_WALLET_TERMINAL_STATUSES.has(discovery.status);

    if (!isActive || !device) return null;

    return <PassphraseModal device={device} />;
};
