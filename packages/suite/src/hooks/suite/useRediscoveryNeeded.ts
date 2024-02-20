import { useEffect, useState } from 'react';
import { useDiscovery, useSelector } from 'src/hooks/suite';
import { selectDeviceDiscovery } from '@suite-common/wallet-core';

export const useRediscoveryNeeded = () => {
    const [isRediscoveryNeeded, setIsRediscoveryNeeded] = useState(false);

    const discovery = useSelector(selectDeviceDiscovery);
    const { isDiscoveryRunning } = useDiscovery();
    useEffect(() => {
        if (discovery && !isDiscoveryRunning && discovery.loaded < discovery.total) {
            setIsRediscoveryNeeded(true);
        } else {
            setIsRediscoveryNeeded(false);
        }
    }, [discovery, isDiscoveryRunning, discovery?.loaded, discovery?.total]);

    return isRediscoveryNeeded;
};
