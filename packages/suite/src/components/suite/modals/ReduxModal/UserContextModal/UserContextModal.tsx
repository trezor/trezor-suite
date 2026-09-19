import { lazy } from 'react';

import { type MODAL_CONTEXT_USER, closeModal as closeModalAction } from '@suite/modal';
import { isOnionUrl } from '@suite/tor';
import { blockchainActions, selectCustomBackends } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { UI_EVENTS } from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

// The four modals imported eagerly below must mount in the same commit that opens them.
// ActivateAssetsModal, AddAccountModal and TransactionReviewModal set state.modal.preserve from a
// mount effect, and a UI_EVENTS.CLOSE_UI_WINDOW arriving before that resets the modal to its
// initial state (see modalReducer). A lazy boundary delays the mount past the event, so the modal
// never appears. QrScannerModal is eager because it already lazy loads @zxing/library itself.
import type { ReduxModalProps } from '../ReduxModalProps';
import { ActivateAssetsModal } from './ActivateAssetsModal';
import { TransactionReviewModal } from '../TransactionReviewModal/TransactionReviewModal';
import { AddAccountModal } from './AddAccountModal/AddAccountModal';
import { QrScannerModal } from './QrScannerModal/QrScannerModal';

const MetadataProviderModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ '@suite/metadata').then(m => ({
        default: m.MetadataProviderModal,
    })),
);
const DisableTorModal = lazy(() =>
    import(/* webpackChunkName: "modals-tor" */ '@suite/tor-desktop').then(m => ({
        default: m.DisableTorModal,
    })),
);
const DisableTorStopCoinjoinModal = lazy(() =>
    import(/* webpackChunkName: "modals-tor" */ '@suite/tor-desktop').then(m => ({
        default: m.DisableTorStopCoinjoinModal,
    })),
);
const RequestEnableTorModal = lazy(() =>
    import(/* webpackChunkName: "modals-tor" */ '@suite/tor-desktop').then(m => ({
        default: m.RequestEnableTorModal,
    })),
);
const EarnClaimModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.EarnClaimModal,
    })),
);
const EarnInANutshellModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.EarnInANutshellModal,
    })),
);
const EarnProviderConsentModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.EarnProviderConsentModal,
    })),
);
const StakeModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.StakeModal,
    })),
);
const TronStakeConsentModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-earn" */ 'src/components/earn/staking/tron/TronStakeConsentModal'
    ).then(m => ({
        default: m.TronStakeConsentModal,
    })),
);
const TronStakeInANutshellModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.TronStakeInANutshellModal,
    })),
);
const TronVoteConsentModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.TronVoteConsentModal,
    })),
);
const UnstakeModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ 'src/components/earn').then(m => ({
        default: m.UnstakeModal,
    })),
);
const ConnectPopupTxSimulationModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-connect-popup" */ 'src/components/tx-simulation/connect-popup'
    ).then(m => ({
        default: m.ConnectPopupTxSimulationModal,
    })),
);
const EarnYieldTxSimulationModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-earn" */ 'src/components/tx-simulation/earn-stablecoin'
    ).then(m => ({
        default: m.EarnYieldTxSimulationModal,
    })),
);
const ConfirmXpubModal = lazy(() =>
    import(/* webpackChunkName: "modals-device" */ '../ConfirmXpubModal').then(m => ({
        default: m.ConfirmXpubModal,
    })),
);
const CopyAddressModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ '../CopyAddressModal').then(m => ({
        default: m.CopyAddressModal,
    })),
);
const PinInvalidModal = lazy(() =>
    import(/* webpackChunkName: "modals-device" */ '../DeviceContextModal/PinInvalidModal').then(
        m => ({ default: m.PinInvalidModal }),
    ),
);
const UnhideTokenModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ '../UnhideTokenModal').then(m => ({
        default: m.UnhideTokenModal,
    })),
);
const AddTokenModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './AddTokenModal').then(m => ({
        default: m.AddTokenModal,
    })),
);
const AdvancedCoinSettingsModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-user" */ './AdvancedCoinSettingsModal/AdvancedCoinSettingsModal'
    ).then(m => ({
        default: m.AdvancedCoinSettingsModal,
    })),
);
const ApplicationLogModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './ApplicationLogModal').then(m => ({
        default: m.ApplicationLogModal,
    })),
);
const AutoStartBeforeQuitModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './AutoStartBeforeQuitModal').then(m => ({
        default: m.AutoStartBeforeQuitModal,
    })),
);
const BackgroundGalleryModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './BackgroundGalleryModal').then(m => ({
        default: m.BackgroundGalleryModal,
    })),
);
const CancelCoinjoinModal = lazy(() =>
    import(/* webpackChunkName: "modals-coinjoin" */ './CancelCoinjoinModal').then(m => ({
        default: m.CancelCoinjoinModal,
    })),
);
const CoinjoinSuccessModal = lazy(() =>
    import(/* webpackChunkName: "modals-coinjoin" */ './CoinjoinSuccessModal').then(m => ({
        default: m.CoinjoinSuccessModal,
    })),
);
const ConfirmUnverifiedProceedModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './ConfirmUnverifiedProceedModal').then(m => ({
        default: m.ConfirmUnverifiedProceedModal,
    })),
);
const ConfirmUnverifiedXpubModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './ConfirmUnverifiedXpubModal').then(m => ({
        default: m.ConfirmUnverifiedXpubModal,
    })),
);
const ConnectAddressConfirmation = lazy(() =>
    import(/* webpackChunkName: "modals-connect-popup" */ './ConnectAddressConfirmation').then(
        m => ({ default: m.ConnectAddressConfirmation }),
    ),
);
const ConnectErrorModal = lazy(() =>
    import(/* webpackChunkName: "modals-connect-popup" */ './ConnectErrorModal').then(m => ({
        default: m.ConnectErrorModal,
    })),
);
const ConnectLoadingModal = lazy(() =>
    import(/* webpackChunkName: "modals-connect-popup" */ './ConnectLoadingModal').then(m => ({
        default: m.ConnectLoadingModal,
    })),
);
const ConnectPermissionsModal = lazy(() =>
    import(/* webpackChunkName: "modals-connect-popup" */ './ConnectPermissionsModal').then(m => ({
        default: m.ConnectPermissionsModal,
    })),
);
const ConnectSelectAccount = lazy(() =>
    import(
        /* webpackChunkName: "modals-connect-popup" */ './ConnectSelectAccount/ConnectSelectAccount'
    ).then(m => ({
        default: m.ConnectSelectAccount,
    })),
);
const CriticalCoinjoinPhaseModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-coinjoin" */ './CriticalCoinjoinPhaseModal/CriticalCoinjoinPhaseModal'
    ).then(m => ({
        default: m.CriticalCoinjoinPhaseModal,
    })),
);
const DeviceAuthenticityOptOutModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './DeviceAuthenticityOptOutModal').then(m => ({
        default: m.DeviceAuthenticityOptOutModal,
    })),
);
const FirmwareRevisionOptOutModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './FirmwareRevisionOptOutModal').then(m => ({
        default: m.FirmwareRevisionOptOutModal,
    })),
);
const ImportTransactionModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-user" */ './ImportTransactionModal/ImportTransactionModal'
    ).then(m => ({
        default: m.ImportTransactionModal,
    })),
);
const MoreRoundsNeededModal = lazy(() =>
    import(/* webpackChunkName: "modals-coinjoin" */ './MoreRoundsNeededModal').then(m => ({
        default: m.MoreRoundsNeededModal,
    })),
);
const PinMismatchModal = lazy(() =>
    import(/* webpackChunkName: "modals-device" */ './PinMismatchModal').then(m => ({
        default: m.PinMismatchModal,
    })),
);
const SafetyChecksModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './SafetyChecksModal').then(m => ({
        default: m.SafetyChecksModal,
    })),
);
const StakeChangeDelegateModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-earn" */ './StakeChangeDelegateModal/StakeChangeDelegateModal'
    ).then(m => ({
        default: m.StakeChangeDelegateModal,
    })),
);
const TorLoadingModal = lazy(() =>
    import(/* webpackChunkName: "modals-tor" */ './TorLoadingModal').then(m => ({
        default: m.TorLoadingModal,
    })),
);
const TxDetailModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './TxDetailModal/TxDetailModal').then(m => ({
        default: m.TxDetailModal,
    })),
);
const UnecoCoinjoinModal = lazy(() =>
    import(/* webpackChunkName: "modals-coinjoin" */ './UnecoCoinjoinModal').then(m => ({
        default: m.UnecoCoinjoinModal,
    })),
);
const WalletConnectProposalModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './WalletConnectProposalModal').then(m => ({
        default: m.WalletConnectProposalModal,
    })),
);
const WalletConnectSwitchAccountModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './WalletConnectSwitchAccountModal').then(m => ({
        default: m.WalletConnectSwitchAccountModal,
    })),
);
const WipeDeviceSuccessModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './WipeDeviceSuccessModal').then(m => ({
        default: m.WipeDeviceSuccessModal,
    })),
);

/** Modals opened as a result of user action */
export const UserContextModal = ({ payload }: ReduxModalProps<typeof MODAL_CONTEXT_USER>) => {
    const customBackends = useSelector(selectCustomBackends);
    const { dispatch } = useServices(injectDispatch);

    const onCancel = () => dispatch(closeModalAction());

    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccountModal
                    device={payload.device}
                    symbol={payload.symbol}
                    isCoinjoinDisabled={payload.isCoinjoinDisabled}
                    isBackClickDisabled={payload.isBackClickDisabled}
                    onCancel={payload.onCancel ?? onCancel}
                    onConfirm={payload.onConfirm}
                />
            );
        case 'unverified-xpub':
            return <ConfirmUnverifiedXpubModal />;
        case 'unverified-address-proceed':
            return <ConfirmUnverifiedProceedModal value={payload.value} />;
        case 'xpub':
            return <ConfirmXpubModal {...payload} onCancel={onCancel} />;
        case 'device-background-gallery':
            return <BackgroundGalleryModal onCancel={onCancel} />;
        case 'device-authenticity-check-opt-out':
            return <DeviceAuthenticityOptOutModal onCancel={onCancel} />;
        case 'firmware-authenticity-checks-opt-out':
            return <FirmwareRevisionOptOutModal onCancel={onCancel} />;
        case 'qr-reader':
            return <QrScannerModal decision={payload.decision} onCancel={onCancel} />;
        case 'transaction-detail':
            return <TxDetailModal {...payload} onCancel={onCancel} />;
        case 'review-transaction':
            return <TransactionReviewModal {...payload} />;
        case 'review-transaction-rbf-previous-transaction-mined-error':
            return <TransactionReviewModal {...payload} />;
        case 'import-transaction':
            return <ImportTransactionModal {...payload} onCancel={onCancel} />;
        case 'pin-mismatch':
            return <PinMismatchModal />;
        case UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED:
            return <PinInvalidModal onCancel={onCancel} />;
        case 'application-log':
            return <ApplicationLogModal onCancel={onCancel} />;
        case 'metadata-provider':
            return <MetadataProviderModal onCancel={onCancel} decision={payload.decision} />;
        case 'advanced-coin-settings':
            return <AdvancedCoinSettingsModal {...payload} onCancel={onCancel} />;
        case 'activate-assets':
            return <ActivateAssetsModal onCancel={onCancel} />;
        case 'add-token':
            return <AddTokenModal {...payload} onCancel={onCancel} />;
        case 'safety-checks':
            return <SafetyChecksModal onCancel={onCancel} />;
        case 'disable-tor': {
            const onionBackends = customBackends.filter(({ urls }) => urls.every(isOnionUrl));

            return (
                <DisableTorModal
                    onionBackends={onionBackends}
                    onDisableTor={() => {
                        onionBackends.forEach(({ symbol, type, urls }) =>
                            dispatch(
                                blockchainActions.setBackend({
                                    symbol,
                                    type,
                                    urls: urls.filter(url => !isOnionUrl(url)),
                                }),
                            ),
                        );
                        payload.decision.resolve(true);
                        onCancel();
                    }}
                    onCancel={onCancel}
                    renderCoinSettings={(symbol, onClose) => (
                        <AdvancedCoinSettingsModal symbol={symbol} onCancel={onClose} />
                    )}
                />
            );
        }
        case 'request-enable-tor':
            return <RequestEnableTorModal decision={payload.decision} onCancel={onCancel} />;
        case 'disable-tor-stop-coinjoin':
            return <DisableTorStopCoinjoinModal decision={payload.decision} onCancel={onCancel} />;
        case 'tor-loading':
            return <TorLoadingModal decision={payload.decision} onCancel={onCancel} />;
        case 'cancel-coinjoin':
            return <CancelCoinjoinModal onClose={onCancel} />;
        case 'critical-coinjoin-phase':
            return (
                <CriticalCoinjoinPhaseModal
                    relatedAccountKey={payload.relatedAccountKey as AccountKey}
                />
            );
        case 'coinjoin-success':
            return (
                <CoinjoinSuccessModal relatedAccountKey={payload.relatedAccountKey as AccountKey} />
            );
        case 'more-rounds-needed':
            return <MoreRoundsNeededModal />;
        case 'uneco-coinjoin-warning':
            return <UnecoCoinjoinModal />;
        case 'earn-in-a-nutshell':
            return <EarnInANutshellModal {...payload} onCancel={onCancel} />;
        case 'tron-stake-in-a-nutshell':
            return <TronStakeInANutshellModal {...payload} onCancel={onCancel} />;
        case 'tron-stake-consent':
            return <TronStakeConsentModal {...payload} onCancel={onCancel} />;
        case 'tron-vote-consent':
            return <TronVoteConsentModal {...payload} onCancel={onCancel} />;
        case 'earn-provider-consent':
            return <EarnProviderConsentModal {...payload} onCancel={onCancel} />;
        case 'stake':
            return <StakeModal {...payload} onCancel={onCancel} />;
        case 'unstake':
            return <UnstakeModal onCancel={onCancel} account={payload.account} />;
        case 'claim':
            return <EarnClaimModal onCancel={onCancel} account={payload.account} />;
        case 'change-delegate':
            return <StakeChangeDelegateModal onCancel={onCancel} />;
        case 'copy-address':
            return (
                <CopyAddressModal
                    onCancel={onCancel}
                    address={payload.address}
                    addressType={payload.addressType}
                    copyAnalyticsFrom={payload.copyAnalyticsFrom}
                />
            );
        case 'unhide-token':
            return <UnhideTokenModal onCancel={onCancel} address={payload.address} />;
        case 'connect-popup':
            return <ConnectPermissionsModal />;
        case 'walletconnect-proposal':
            return <WalletConnectProposalModal eventId={payload.eventId} />;
        case 'walletconnect-switch-account':
            return <WalletConnectSwitchAccountModal sessionTopic={payload.sessionTopic} />;
        case 'connect-address-confirmation':
            return <ConnectAddressConfirmation />;
        case 'connect-select-account':
            return <ConnectSelectAccount />;
        case 'connect-error':
            return <ConnectErrorModal />;
        case 'connect-loading':
            return <ConnectLoadingModal />;
        case 'auto-start-before-quit':
            return <AutoStartBeforeQuitModal />;
        case 'connect-popup-tx-simulation':
            return <ConnectPopupTxSimulationModal />;
        case 'earn-yield-tx-simulation':
            return (
                <EarnYieldTxSimulationModal
                    decision={payload.decision}
                    data={payload.data}
                    closeModal={onCancel}
                />
            );
        case 'wipe-device-success':
            return <WipeDeviceSuccessModal />;
        default:
            return exhaustive(payload);
    }
};
