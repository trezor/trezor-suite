import { selectAccountsByDeviceState, selectSelectedDevice } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

export const useRediscoveryNeeded = () => {
    const device = useSelector(selectSelectedDevice);

    if (!device?.state?.staticSessionId) return false;

    // todo: duplicated with discoveryThunk

    const discoveredNetworks = [
        ...new Set(
            useSelector(state =>
                selectAccountsByDeviceState(state, device!.state!.staticSessionId!).map(
                    account => account.symbol,
                ),
            ),
        ),
    ];
    const suiteEnabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);

    const networksToDiscover = suiteEnabledNetworks.filter(
        network => !discoveredNetworks.includes(network),
    );

    return networksToDiscover.length > 0;
};
