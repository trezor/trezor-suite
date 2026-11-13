/**
 * The modals these declarations load live in this package, so they are reachable only from here.
 * `UserContextModal` renders them from `@suite-app/app-modal`, behind the `Suspense` boundary in
 * `ModalSwitcher`, and reaches them through this object rather than through static re-exports,
 * which would pull every modal back into the boot bundle.
 */
import { lazy } from 'react';

/**
 * The four modals imported eagerly below must mount in the same commit that opens them.
 * ActivateAssetsModal, AddAccountModal and TransactionReviewModal set state.modal.preserve from a
 * mount effect, and a UI_EVENTS.CLOSE_UI_WINDOW arriving before that resets the modal to its
 * initial state (see modalReducer). A lazy boundary delays the mount past the event, so the modal
 * never appears. QrScannerModal is eager because it already lazy loads @zxing/library itself.
 */
import { ActivateAssetsModal } from './ActivateAssetsModal';
import { TransactionReviewModal } from '../TransactionReviewModal/TransactionReviewModal';
import { AddAccountModal } from './AddAccountModal/AddAccountModal';
import { QrScannerModal } from './QrScannerModal/QrScannerModal';
import {
    loadApplicationLogModal,
    loadBackgroundGalleryModal,
    loadSafetyChecksModal,
} from './modalChunkLoaders';

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
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.EarnClaimModal,
    })),
);
const EarnInANutshellModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.EarnInANutshellModal,
    })),
);
const EarnProviderConsentModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.EarnProviderConsentModal,
    })),
);
const StakeModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.StakeModal,
    })),
);
const TronStakeConsentModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-earn" */ '#src/components/earn/staking/tron/TronStakeConsentModal'
    ).then(m => ({
        default: m.TronStakeConsentModal,
    })),
);
const TronStakeInANutshellModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.TronStakeInANutshellModal,
    })),
);
const TronVoteConsentModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.TronVoteConsentModal,
    })),
);
const UnstakeModal = lazy(() =>
    import(/* webpackChunkName: "modals-earn" */ '#src/components/earn').then(m => ({
        default: m.UnstakeModal,
    })),
);
const ConnectPopupTxSimulationModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-connect-popup" */ '#src/components/tx-simulation/connect-popup'
    ).then(m => ({
        default: m.ConnectPopupTxSimulationModal,
    })),
);
const EarnYieldTxSimulationModal = lazy(() =>
    import(
        /* webpackChunkName: "modals-earn" */ '#src/components/tx-simulation/earn-stablecoin'
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
    loadApplicationLogModal().then(m => ({ default: m.ApplicationLogModal })),
);
const AutoStartBeforeQuitModal = lazy(() =>
    import(/* webpackChunkName: "modals-user" */ './AutoStartBeforeQuitModal').then(m => ({
        default: m.AutoStartBeforeQuitModal,
    })),
);
const BackgroundGalleryModal = lazy(() =>
    loadBackgroundGalleryModal().then(m => ({ default: m.BackgroundGalleryModal })),
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
    loadSafetyChecksModal().then(m => ({ default: m.SafetyChecksModal })),
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

export const lazyUserContextModals = {
    ActivateAssetsModal,
    AddAccountModal,
    AddTokenModal,
    AdvancedCoinSettingsModal,
    ApplicationLogModal,
    AutoStartBeforeQuitModal,
    BackgroundGalleryModal,
    CancelCoinjoinModal,
    CoinjoinSuccessModal,
    ConfirmUnverifiedProceedModal,
    ConfirmUnverifiedXpubModal,
    ConfirmXpubModal,
    ConnectAddressConfirmation,
    ConnectErrorModal,
    ConnectLoadingModal,
    ConnectPermissionsModal,
    ConnectPopupTxSimulationModal,
    ConnectSelectAccount,
    CopyAddressModal,
    CriticalCoinjoinPhaseModal,
    DeviceAuthenticityOptOutModal,
    DisableTorModal,
    DisableTorStopCoinjoinModal,
    EarnClaimModal,
    EarnInANutshellModal,
    EarnProviderConsentModal,
    EarnYieldTxSimulationModal,
    FirmwareRevisionOptOutModal,
    ImportTransactionModal,
    MetadataProviderModal,
    MoreRoundsNeededModal,
    PinInvalidModal,
    PinMismatchModal,
    QrScannerModal,
    RequestEnableTorModal,
    SafetyChecksModal,
    StakeChangeDelegateModal,
    StakeModal,
    TorLoadingModal,
    TransactionReviewModal,
    TronStakeConsentModal,
    TronStakeInANutshellModal,
    TronVoteConsentModal,
    TxDetailModal,
    UnecoCoinjoinModal,
    UnhideTokenModal,
    UnstakeModal,
    WalletConnectProposalModal,
    WalletConnectSwitchAccountModal,
    WipeDeviceSuccessModal,
};
