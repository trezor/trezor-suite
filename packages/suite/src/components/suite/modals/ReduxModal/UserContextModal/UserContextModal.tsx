import { MetadataProviderModal } from '@suite/metadata';
import { type MODAL_CONTEXT_USER, closeModal as closeModalAction } from '@suite/modal';
import { type AccountKey } from '@suite-common/wallet-types';
import { UI_REQUEST } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import {
    EarnClaimModal,
    EarnInANutshellModal,
    EarnProviderConsentModal,
    StakeModal,
    UnstakeModal,
} from 'src/components/earn';
import { ConnectPopupTxSimulationModal } from 'src/components/tx-simulation/connect-popup';
import { EarnYieldTxSimulationModal } from 'src/components/tx-simulation/earn-stablecoin';
import { useDispatch } from 'src/hooks/suite';
import type { AcquiredDevice } from 'src/types/suite';

import { ConfirmAddressModal } from '../ConfirmAddressModal';
import { ConfirmXpubModal } from '../ConfirmXpubModal';
import { CopyAddressModal } from '../CopyAddressModal';
import { ActivateAssetsModal } from './ActivateAssetsModal';
import { AddAccountModal } from './AddAccountModal/AddAccountModal';
import { AddTokenModal } from './AddTokenModal';
import type { ReduxModalProps } from '../ReduxModalProps';
import { AdvancedCoinSettingsModal } from './AdvancedCoinSettingsModal/AdvancedCoinSettingsModal';
import { ApplicationLogModal } from './ApplicationLogModal';
import { BackgroundGalleryModal } from './BackgroundGalleryModal';
import { PinInvalidModal } from '../DeviceContextModal/PinInvalidModal';
import { TransactionReviewModal } from '../TransactionReviewModal/TransactionReviewModal';
import { UnhideTokenModal } from '../UnhideTokenModal';
import { AutoStartBeforeQuitModal } from './AutoStartBeforeQuitModal';
import { CancelCoinjoinModal } from './CancelCoinjoinModal';
import { CoinjoinSuccessModal } from './CoinjoinSuccessModal';
import { ConfirmUnverifiedAddressModal } from './ConfirmUnverifiedAddressModal';
import { ConfirmUnverifiedProceedModal } from './ConfirmUnverifiedProceedModal';
import { ConfirmUnverifiedXpubModal } from './ConfirmUnverifiedXpubModal';
import { ConnectAddressConfirmation } from './ConnectAddressConfirmation';
import { ConnectErrorModal } from './ConnectErrorModal';
import { ConnectLoadingModal } from './ConnectLoadingModal';
import { ConnectPermissionsModal } from './ConnectPermissionsModal';
import { CriticalCoinjoinPhaseModal } from './CriticalCoinjoinPhaseModal/CriticalCoinjoinPhaseModal';
import { DeviceAuthenticityOptOutModal } from './DeviceAuthenticityOptOutModal';
import { DisableTorModal } from './DisableTorModal';
import { DisableTorStopCoinjoinModal } from './DisableTorStopCoinjoinModal';
import { FirmwareRevisionOptOutModal } from './FirmwareRevisionOptOutModal';
import { ImportTransactionModal } from './ImportTransactionModal/ImportTransactionModal';
import { MoreRoundsNeededModal } from './MoreRoundsNeededModal';
import { PinMismatchModal } from './PinMismatchModal';
import { QrScannerModal } from './QrScannerModal/QrScannerModal';
import { RequestEnableTorModal } from './RequestEnableTorModal';
import { SafetyChecksModal } from './SafetyChecksModal';
import { StakeChangeDelegateModal } from './StakeChangeDelegateModal/StakeChangeDelegateModal';
import { TorLoadingModal } from './TorLoadingModal';
import { TxDetailModal } from './TxDetailModal/TxDetailModal';
import { UnecoCoinjoinModal } from './UnecoCoinjoinModal';
import { WalletConnectProposalModal } from './WalletConnectProposalModal';
import { WalletConnectSwitchAccountModal } from './WalletConnectSwitchAccountModal';
import { WipeDeviceSuccessModal } from './WipeDeviceSuccessModal';

/** Modals opened as a result of user action */
export const UserContextModal = ({ payload }: ReduxModalProps<typeof MODAL_CONTEXT_USER>) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(closeModalAction());

    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccountModal
                    device={payload.device as AcquiredDevice}
                    symbol={payload.symbol}
                    noRedirect={payload.noRedirect}
                    isCoinjoinDisabled={payload.isCoinjoinDisabled}
                    isBackClickDisabled={payload.isBackClickDisabled}
                    onCancel={payload.onCancel ?? onCancel}
                    onConfirm={payload.onConfirm}
                />
            );
        case 'unverified-address':
            return (
                <ConfirmUnverifiedAddressModal
                    addressPath={payload.addressPath}
                    value={payload.value}
                />
            );
        case 'unverified-xpub':
            return <ConfirmUnverifiedXpubModal />;
        case 'unverified-address-proceed':
            return <ConfirmUnverifiedProceedModal value={payload.value} />;
        case 'address':
            return <ConfirmAddressModal {...payload} onCancel={onCancel} />;
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
        case UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED:
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
        case 'disable-tor':
            return <DisableTorModal decision={payload.decision} onCancel={onCancel} />;
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
        case 'connect-error':
            return <ConnectErrorModal />;
        case 'connect-loading':
            return <ConnectLoadingModal />;
        case 'auto-start-before-quit':
            return <AutoStartBeforeQuitModal />;
        case 'connect-popup-tx-simulation':
            return <ConnectPopupTxSimulationModal />;
        case 'earn-yield-tx-simulation':
            return <EarnYieldTxSimulationModal />;
        case 'wipe-device-success':
            return <WipeDeviceSuccessModal />;
        default:
            return exhaustive(payload);
    }
};
