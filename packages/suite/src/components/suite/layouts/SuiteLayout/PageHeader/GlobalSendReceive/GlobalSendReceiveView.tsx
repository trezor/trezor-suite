import { useSelector } from 'react-redux';

import { useDevice } from '@suite/device';
import { type TradingAssetOption } from '@suite-common/trading';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account, type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { resetProtocol } from 'src/actions/suite/protocolActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { globalSendReceiveFiltersActions } from 'src/slices/wallet/globalSendReceiveFilters';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { GlobalReceiveModal } from './GlobalReceiveModal/GlobalReceiveModal';
import { GlobalSendModal } from './GlobalSendModal/GlobalSendModal';
import { GlobalSendReceiveButtons } from './GlobalSendReceiveButtons';
import { GlobalSendReceiveAssetDescription } from './components/GlobalSendReceiveAssetDescription';
import { useGlobalSendReceiveAnalytics } from './hooks/useGlobalSendReceiveAnalytics';
import { useStartSendReceiveWithAnalytics } from './hooks/useStartSendReceiveWithAnalytics';
import { type GlobalSendTarget } from './types';

type GlobalSendReceiveViewProps = {
    activeModal: GlobalSendReceiveType;
    onOpen: (modal: NonNullable<GlobalSendReceiveType>) => void;
    onClose: () => void;
    asset?: TradingAssetOption;
    sendTargets?: readonly GlobalSendTarget[];
};

export const GlobalSendReceiveView = ({
    activeModal,
    onOpen,
    onClose,
    asset,
    sendTargets,
}: GlobalSendReceiveViewProps) => {
    const accounts = useSelector(selectAllAccountsToList);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const { device } = useDevice();
    const { dispatch } = useServices(injectDispatch);
    const { sendAnalytics, receiveAnalytics } = useGlobalSendReceiveAnalytics();
    const { startSend, startReceive } = useStartSendReceiveWithAnalytics();

    const isDeviceConnected = !!device?.connected && !!device?.available;
    // The dashboard shows the `EmptyWallet` screen (with its own primary Buy/Receive CTAs)
    // when discovery has finished and every account is empty. In that case we demote the
    // header Send/Receive buttons so the EmptyWallet CTAs stand out and we avoid two
    // competing primary calls-to-action on the same page.
    const isEmptyWalletShown =
        discoveryStatus === undefined && accounts.length > 0 && accounts.every(a => a.empty);
    const shouldPromoteButtons = isDeviceConnected && !isEmptyWalletShown;
    const buttonIntent = shouldPromoteButtons ? 'brand' : 'neutral';
    const buttonPriority = shouldPromoteButtons ? 'primary' : 'secondary';
    const assetDescription =
        asset === undefined ? undefined : <GlobalSendReceiveAssetDescription asset={asset} />;

    const handleOpen = (modal: NonNullable<GlobalSendReceiveType>) => {
        dispatch(globalSendReceiveFiltersActions.resetFilters());
        onOpen(modal);
    };

    const handleSendSubmit = (target: GlobalSendTarget, filledSearch: boolean) => {
        sendAnalytics.account(filledSearch);
        startSend(target);
    };

    const handleReceiveSubmit = (account: Account, filledSearch: boolean) => {
        receiveAnalytics.account(filledSearch);
        startReceive(account);
    };

    const handleSendCancel = (filledSearch: boolean) => {
        sendAnalytics.close(filledSearch);
        onClose();
        dispatch(resetProtocol());
        dispatch(globalSendReceiveFiltersActions.resetFilters());
    };

    const handleReceiveCancel = (filledSearch: boolean) => {
        receiveAnalytics.close(filledSearch);
        onClose();
        dispatch(globalSendReceiveFiltersActions.resetFilters());
    };

    return (
        <AppNavigationTooltip>
            <GlobalSendReceiveButtons
                onOpen={handleOpen}
                intent={buttonIntent}
                priority={buttonPriority}
            />
            {activeModal === 'send' && (
                <GlobalSendModal
                    targets={sendTargets}
                    description={assetDescription}
                    onCancel={handleSendCancel}
                    onSubmit={handleSendSubmit}
                />
            )}
            {activeModal === 'receive' && (
                <GlobalReceiveModal
                    initialAsset={asset}
                    onCancel={handleReceiveCancel}
                    onSubmit={handleReceiveSubmit}
                />
            )}
        </AppNavigationTooltip>
    );
};
