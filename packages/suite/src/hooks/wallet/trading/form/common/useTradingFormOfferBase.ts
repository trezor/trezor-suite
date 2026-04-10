import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { breakpoints } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { useTradingDeviceDisconnected } from './useTradingDeviceDisconnected';
import { useTradingFormContext } from '../useTradingCommonForm';

export const useTradingFormOfferBase = () => {
    const { account } = useTradingFormContext();
    const { isTorEnabled } = useSelector(selectTorState);
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();
    const areFeesLoading = useSelector(s => selectAreFeesLoading(s, account.symbol));
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    return {
        isTorEnabled,
        tradingDeviceDisconnected,
        areFeesLoading,
        isDiscoveryRunning,
        isContentBelowBreakpoint,
    };
};
