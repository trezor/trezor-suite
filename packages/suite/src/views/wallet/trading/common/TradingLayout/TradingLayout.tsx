import { type PropsWithChildren } from 'react';

import { selectRouteName } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { DiscoveryEmpty } from 'src/components/wallet/WalletLayout/AccountException/DiscoveryEmpty';
import { useSelector } from 'src/hooks/suite';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingLayoutNavigation } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';

export const TradingLayout = ({ children }: PropsWithChildren) => {
    const routeName = useSelector(selectRouteName);
    const selectedDevice = useSelector(selectSelectedDevice);
    const hasVisibleAccounts = useSelector(state => selectVisibleDeviceAccounts(state).length > 0);
    const isSelectedDeviceConnected = !!selectedDevice?.connected;
    const noVisibleAccountsContent = !isSelectedDeviceConnected ? (
        <ConnectDeviceGenericPromo />
    ) : (
        <Column alignItems="center" height="100%">
            <DiscoveryEmpty />
        </Column>
    );

    return (
        <Column data-testid="@trading" gap={24}>
            <TradingLayoutNavigation route={routeName} />
            {hasVisibleAccounts ? children : noVisibleAccountsContent}
        </Column>
    );
};
