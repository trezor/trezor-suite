/**
 * Reached through these exports rather than static re-exports, which would pull every modal back
 * into the boot bundle. `UserContextModal` renders them behind the `Suspense` in `ModalSwitcher`.
 */

import { lazyComponentByName } from '@trezor/lazy-loading';

/**
 * Eager: ActivateAssetsModal, AddAccountModal and TransactionReviewModal set state.modal.preserve
 * from a mount effect, and a lazy boundary would delay it past UI_EVENTS.CLOSE_UI_WINDOW, which
 * resets the modal (see modalReducer). QrScannerModal already lazy loads @zxing/library itself.
 */
import { ActivateAssetsModal } from './ActivateAssetsModal';
import { TransactionReviewModal } from '../TransactionReviewModal/TransactionReviewModal';
import { AddAccountModal } from './AddAccountModal/AddAccountModal';
import { QrScannerModal } from './QrScannerModal/QrScannerModal';

/**
 * `webpackExports` on the barrel imports below: a runtime key picks the export, so without it the
 * bundler ships all of them. Measured at +5.2 KB of `@suite/tor-desktop` UI in `modals-tor`.
 */
export const { LazyComponent: MetadataProviderModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-user", webpackExports: ["MetadataProviderModal"] */ '@suite/metadata'
        ),
    'MetadataProviderModal',
);
export const { LazyComponent: DisableTorModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-tor", webpackExports: ["DisableTorModal"] */ '@suite/tor-desktop'
        ),
    'DisableTorModal',
);
export const { LazyComponent: DisableTorStopCoinjoinModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-tor", webpackExports: ["DisableTorStopCoinjoinModal"] */ '@suite/tor-desktop'
        ),
    'DisableTorStopCoinjoinModal',
);
export const { LazyComponent: RequestEnableTorModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-tor", webpackExports: ["RequestEnableTorModal"] */ '@suite/tor-desktop'
        ),
    'RequestEnableTorModal',
);
export const { LazyComponent: EarnClaimModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/modals/EarnClaimModal/EarnClaimModal'
        ),
    'EarnClaimModal',
);
export const { LazyComponent: EarnInANutshellModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/modals/EarnInANutshell/EarnInANutshellModal'
        ),
    'EarnInANutshellModal',
);
export const { LazyComponent: EarnProviderConsentModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/modals/EarnProviderConsent/EarnProviderConsentModal'
        ),
    'EarnProviderConsentModal',
);
export const { LazyComponent: StakeModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/modals/StakeModal/StakeModal'
        ),
    'StakeModal',
);
export const { LazyComponent: TronStakeConsentModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/staking/tron/TronStakeConsentModal'
        ),
    'TronStakeConsentModal',
);
export const { LazyComponent: TronStakeInANutshellModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/modals/EarnInANutshell/TronStakeInANutshellModal'
        ),
    'TronStakeInANutshellModal',
);
export const { LazyComponent: TronVoteConsentModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/staking/tron/vote/TronVoteConsentModal'
        ),
    'TronVoteConsentModal',
);
export const { LazyComponent: UnstakeModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/earn/modals/UnstakeModal/UnstakeModal'
        ),
    'UnstakeModal',
);
export const { LazyComponent: ConnectPopupTxSimulationModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-connect-popup" */ '#src/components/tx-simulation/connect-popup/ConnectPopupTxSimulationModal'
        ),
    'ConnectPopupTxSimulationModal',
);
export const { LazyComponent: EarnYieldTxSimulationModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ '#src/components/tx-simulation/earn-stablecoin/EarnYieldTxSimulationModal'
        ),
    'EarnYieldTxSimulationModal',
);
export const { LazyComponent: ConfirmXpubModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ '../ConfirmXpubModal'),
    'ConfirmXpubModal',
);
export const { LazyComponent: CopyAddressModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ '../CopyAddressModal'),
    'CopyAddressModal',
);
export const { LazyComponent: PinInvalidModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ '../DeviceContextModal/PinInvalidModal'),
    'PinInvalidModal',
);
export const { LazyComponent: UnhideTokenModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ '../UnhideTokenModal'),
    'UnhideTokenModal',
);
export const { LazyComponent: AddTokenModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './AddTokenModal'),
    'AddTokenModal',
);
export const { LazyComponent: AdvancedCoinSettingsModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-user" */ './AdvancedCoinSettingsModal/AdvancedCoinSettingsModal'
        ),
    'AdvancedCoinSettingsModal',
);
export const { LazyComponent: ApplicationLogModal, load: loadApplicationLogModal } =
    lazyComponentByName(
        () => import(/* webpackChunkName: "modals-user" */ './ApplicationLogModal'),
        'ApplicationLogModal',
    );
export const { LazyComponent: AutoStartBeforeQuitModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './AutoStartBeforeQuitModal'),
    'AutoStartBeforeQuitModal',
);
export const { LazyComponent: BackgroundGalleryModal, load: loadBackgroundGalleryModal } =
    lazyComponentByName(
        () => import(/* webpackChunkName: "modals-user" */ './BackgroundGalleryModal'),
        'BackgroundGalleryModal',
    );
export const { LazyComponent: CancelCoinjoinModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-coinjoin" */ './CancelCoinjoinModal'),
    'CancelCoinjoinModal',
);
export const { LazyComponent: CoinjoinSuccessModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-coinjoin" */ './CoinjoinSuccessModal'),
    'CoinjoinSuccessModal',
);
export const { LazyComponent: ConfirmUnverifiedProceedModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './ConfirmUnverifiedProceedModal'),
    'ConfirmUnverifiedProceedModal',
);
export const { LazyComponent: ConfirmUnverifiedXpubModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './ConfirmUnverifiedXpubModal'),
    'ConfirmUnverifiedXpubModal',
);
export const { LazyComponent: ConnectAddressConfirmation } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connect-popup" */ './ConnectAddressConfirmation'),
    'ConnectAddressConfirmation',
);
export const { LazyComponent: ConnectErrorModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connect-popup" */ './ConnectErrorModal'),
    'ConnectErrorModal',
);
export const { LazyComponent: ConnectLoadingModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connect-popup" */ './ConnectLoadingModal'),
    'ConnectLoadingModal',
);
export const { LazyComponent: ConnectPermissionsModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connect-popup" */ './ConnectPermissionsModal'),
    'ConnectPermissionsModal',
);
export const { LazyComponent: ConnectSelectAccount } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-connect-popup" */ './ConnectSelectAccount/ConnectSelectAccount'
        ),
    'ConnectSelectAccount',
);
export const { LazyComponent: CriticalCoinjoinPhaseModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-coinjoin" */ './CriticalCoinjoinPhaseModal/CriticalCoinjoinPhaseModal'
        ),
    'CriticalCoinjoinPhaseModal',
);
export const { LazyComponent: DeviceAuthenticityOptOutModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './DeviceAuthenticityOptOutModal'),
    'DeviceAuthenticityOptOutModal',
);
export const { LazyComponent: FirmwareRevisionOptOutModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './FirmwareRevisionOptOutModal'),
    'FirmwareRevisionOptOutModal',
);
export const { LazyComponent: ImportTransactionModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-user" */ './ImportTransactionModal/ImportTransactionModal'
        ),
    'ImportTransactionModal',
);
export const { LazyComponent: MoreRoundsNeededModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-coinjoin" */ './MoreRoundsNeededModal'),
    'MoreRoundsNeededModal',
);
export const { LazyComponent: PinMismatchModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './PinMismatchModal'),
    'PinMismatchModal',
);
export const { LazyComponent: SafetyChecksModal, load: loadSafetyChecksModal } =
    lazyComponentByName(
        () => import(/* webpackChunkName: "modals-user" */ './SafetyChecksModal'),
        'SafetyChecksModal',
    );
export const { LazyComponent: StakeChangeDelegateModal } = lazyComponentByName(
    () =>
        import(
            /* webpackChunkName: "modals-earn" */ './StakeChangeDelegateModal/StakeChangeDelegateModal'
        ),
    'StakeChangeDelegateModal',
);
export const { LazyComponent: TorLoadingModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-tor" */ './TorLoadingModal'),
    'TorLoadingModal',
);
export const { LazyComponent: TxDetailModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './TxDetailModal/TxDetailModal'),
    'TxDetailModal',
);
export const { LazyComponent: UnecoCoinjoinModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-coinjoin" */ './UnecoCoinjoinModal'),
    'UnecoCoinjoinModal',
);
export const { LazyComponent: WalletConnectProposalModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './WalletConnectProposalModal'),
    'WalletConnectProposalModal',
);
export const { LazyComponent: WalletConnectSwitchAccountModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './WalletConnectSwitchAccountModal'),
    'WalletConnectSwitchAccountModal',
);
export const { LazyComponent: WipeDeviceSuccessModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-user" */ './WipeDeviceSuccessModal'),
    'WipeDeviceSuccessModal',
);

/** Eager, for the reason given above; exported by name like every modal here. */
export { ActivateAssetsModal, AddAccountModal, QrScannerModal, TransactionReviewModal };
