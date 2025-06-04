import { CryptoId } from 'invity-api';

import { exhaustive } from '@trezor/type-utils';

import { MODAL } from 'src/actions/suite/constants';
import { onCancel as onCancelAction } from 'src/actions/suite/modalActions';
import {
    AddAccountModal,
    AddTokenModal,
    AdvancedCoinSettingsModal,
    ApplicationLogModal,
    AuthenticateDeviceFailModal,
    AuthenticateDeviceModal,
    BackgroundGalleryModal,
    CancelCoinjoinModal,
    ClaimModal,
    CoinjoinSuccessModal,
    ConfirmAddressModal,
    ConfirmUnverifiedAddressModal,
    ConfirmUnverifiedProceedModal,
    ConfirmUnverifiedXpubModal,
    ConfirmXpubModal,
    ConnectPermissionsModal,
    CopyAddressModal,
    CriticalCoinjoinPhaseModal,
    DeviceAuthenticityOptOutModal,
    DisableTorModal,
    DisableTorStopCoinjoinModal,
    ImportTransactionModal,
    MetadataProviderModal,
    MoreRoundsNeededModal,
    PinMismatchModal,
    QrScannerModal,
    RequestEnableTorModal,
    SafetyChecksModal,
    StakeInANutshellModal,
    StakeModal,
    TorLoadingModal,
    TradingTermsModal,
    TransactionReviewModal,
    TxDetailModal,
    UnecoCoinjoinModal,
    UnhideTokenModal,
    UnstakeModal,
} from 'src/components/suite/modals';
import { useDispatch } from 'src/hooks/suite';
import type { AcquiredDevice } from 'src/types/suite';

import type { ReduxModalProps } from '../ReduxModal';
import { AutoStartBeforeQuitModal } from './AutoStartBeforeQuitModal';
import { FirmwareRevisionOptOutModal } from './FirmwareRevisionOptOutModal';
import { CardanoWithdrawModal } from '../CardanoWithdrawModal';
import { ConnectAddressConfirmation } from './ConnectAddressConfirmation';
import { ConnectErrorModal } from './ConnectErrorModal';
import { ConnectLoadingModal } from './ConnectLoadingModal';
import { TradingDCAModal } from './TradingDCAModal';
import { EverstakeModal } from './UnstakeModal/EverstakeModal';
import { WalletConnectProposalModal } from './WalletConnectProposalModal';
import { WalletConnectSwitchAccountModal } from './WalletConnectSwitchAccountModal';

/** Modals opened as a result of user action */
export const UserContextModal = ({ payload }: ReduxModalProps<typeof MODAL.CONTEXT_USER>) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(onCancelAction());

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
        case 'cardano-withdraw-modal':
            return <CardanoWithdrawModal onCancel={onCancel} />;
        case 'trading-buy-terms': {
            return (
                <TradingTermsModal
                    onCancel={onCancel}
                    type="BUY"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoId}
                />
            );
        }
        case 'trading-sell-terms':
            return (
                <TradingTermsModal
                    onCancel={onCancel}
                    type="SELL"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoId}
                />
            );

        case 'trading-exchange-terms':
            return (
                <TradingTermsModal
                    onCancel={onCancel}
                    type="TRADING_SWAP"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency as CryptoId}
                    fromCryptoCurrency={payload.fromCryptoCurrency as CryptoId}
                />
            );
        case 'trading-exchange-dex-terms':
            return (
                <TradingTermsModal
                    onCancel={onCancel}
                    type="TRADING_SWAP_DEX"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency as CryptoId}
                    fromCryptoCurrency={payload.fromCryptoCurrency as CryptoId}
                />
            );
        case 'import-transaction':
            return <ImportTransactionModal {...payload} onCancel={onCancel} />;
        case 'pin-mismatch':
            return <PinMismatchModal />;
        case 'application-log':
            return <ApplicationLogModal onCancel={onCancel} />;
        case 'metadata-provider':
            return <MetadataProviderModal onCancel={onCancel} decision={payload.decision} />;
        case 'advanced-coin-settings':
            return <AdvancedCoinSettingsModal {...payload} onCancel={onCancel} />;
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
            return <CriticalCoinjoinPhaseModal relatedAccountKey={payload.relatedAccountKey} />;
        case 'coinjoin-success':
            return <CoinjoinSuccessModal relatedAccountKey={payload.relatedAccountKey} />;
        case 'more-rounds-needed':
            return <MoreRoundsNeededModal />;
        case 'uneco-coinjoin-warning':
            return <UnecoCoinjoinModal />;
        case 'authenticate-device':
            return <AuthenticateDeviceModal />;
        case 'authenticate-device-fail':
            return <AuthenticateDeviceFailModal />;
        case 'stake-in-a-nutshell':
            return <StakeInANutshellModal onCancel={onCancel} />;
        case 'stake':
            return <StakeModal onCancel={onCancel} />;
        case 'unstake':
            return <UnstakeModal onCancel={onCancel} />;
        case 'claim':
            return <ClaimModal onCancel={onCancel} />;
        case 'everstake':
            return <EverstakeModal onCancel={onCancel} />;
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
        case 'trading-dca':
            return <TradingDCAModal device={payload.device} onCancel={onCancel} />;
        case 'connect-address-confirmation':
            return <ConnectAddressConfirmation />;
        case 'connect-error':
            return <ConnectErrorModal />;
        case 'connect-loading':
            return <ConnectLoadingModal />;
        case 'auto-start-before-quit':
            return <AutoStartBeforeQuitModal />;
        default:
            return exhaustive(payload);
    }
};
