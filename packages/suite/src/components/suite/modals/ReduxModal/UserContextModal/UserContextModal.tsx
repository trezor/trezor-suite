import { onCancel as onCancelAction } from 'src/actions/suite/modalActions';
import { MODAL } from 'src/actions/suite/constants';
import { useDispatch } from 'src/hooks/suite';
import {
    PinMismatchModal,
    PassphraseDuplicateModal,
    CoinmarketTermsModal,
    CoinmarketLeaveSpendModal,
    ConfirmAddressModal,
    ConfirmXpubModal,
    TransactionReviewModal,
    ImportTransactionModal,
    AddAccountModal,
    QrScannerModal,
    BackgroundGalleryModal,
    TxDetailModal,
    ApplicationLogModal,
    WipeDeviceModal,
    MetadataProviderModal,
    AdvancedCoinSettingsModal,
    AddTokenModal,
    SafetyChecksModal,
    DisableTorModal,
    DisableTorStopCoinjoinModal,
    RequestEnableTorModal,
    TorLoadingModal,
    CancelCoinjoinModal,
    CriticalCoinjoinPhaseModal,
    CoinjoinSuccessModal,
    MoreRoundsNeededModal,
    ConfirmUnverifiedModal,
    ConfirmUnverifiedAddressModal,
    UnecoCoinjoinModal,
    AuthenticateDeviceModal,
    AuthenticateDeviceFailModal,
    DeviceAuthenticityOptOutModal,
    StakeEthInANutshellModal,
    StakeModal,
    UnstakeModal,
    ClaimModal,
} from 'src/components/suite/modals';
import type { AcquiredDevice } from 'src/types/suite';
import { openXpubModal, showXpub } from 'src/actions/wallet/publicKeyActions';
import type { ReduxModalProps } from '../ReduxModal';
import { CryptoSymbol } from 'invity-api';

/** Modals opened as a result of user action */
export const UserContextModal = ({
    payload,
    renderer,
}: ReduxModalProps<typeof MODAL.CONTEXT_USER>) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(onCancelAction());

    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccountModal
                    device={payload.device as AcquiredDevice}
                    symbol={payload.symbol}
                    noRedirect={payload.noRedirect}
                    onCancel={onCancel}
                />
            );
        case 'unverified-address':
            return (
                <ConfirmUnverifiedAddressModal
                    addressPath={payload.addressPath}
                    value={payload.value}
                    onCancel={onCancel}
                />
            );
        case 'unverified-xpub':
            return (
                <ConfirmUnverifiedModal
                    showUnverifiedButtonText="TR_SHOW_UNVERIFIED_XPUB"
                    warningText="TR_XPUB_PHISHING_WARNING"
                    verify={showXpub}
                    showUnverified={openXpubModal}
                />
            );
        case 'address':
            return <ConfirmAddressModal {...payload} onCancel={onCancel} />;
        case 'xpub':
            return <ConfirmXpubModal {...payload} onCancel={onCancel} />;
        case 'device-background-gallery':
            return <BackgroundGalleryModal onCancel={onCancel} />;
        case 'wipe-device':
            return <WipeDeviceModal onCancel={onCancel} />;
        case 'device-authenticity-opt-out':
            return <DeviceAuthenticityOptOutModal onCancel={onCancel} />;
        case 'qr-reader':
            return (
                <QrScannerModal
                    decision={payload.decision}
                    allowPaste={payload.allowPaste}
                    onCancel={onCancel}
                />
            );
        case 'transaction-detail':
            return <TxDetailModal {...payload} onCancel={onCancel} />;
        case 'passphrase-duplicate':
            return (
                <PassphraseDuplicateModal device={payload.device} duplicate={payload.duplicate} />
            );
        case 'review-transaction':
            return <TransactionReviewModal {...payload} />;
        case 'coinmarket-leave-spend':
            return <CoinmarketLeaveSpendModal {...payload} onCancel={onCancel} />;
        case 'coinmarket-buy-terms': {
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="BUY"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoSymbol}
                />
            );
        }
        case 'coinmarket-sell-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="SELL"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoSymbol}
                />
            );

        case 'coinmarket-exchange-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="EXCHANGE"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency as CryptoSymbol}
                    fromCryptoCurrency={payload.fromCryptoCurrency as CryptoSymbol}
                />
            );
        case 'coinmarket-exchange-dex-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="EXCHANGE_DEX"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency as CryptoSymbol}
                    fromCryptoCurrency={payload.fromCryptoCurrency as CryptoSymbol}
                />
            );
        case 'coinmarket-savings-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="SAVINGS"
                    decision={payload.decision}
                    provider={payload.provider}
                />
            );
        case 'coinmarket-p2p-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="P2P"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoSymbol}
                />
            );
        case 'import-transaction':
            return <ImportTransactionModal {...payload} onCancel={onCancel} />;
        case 'pin-mismatch':
            return <PinMismatchModal renderer={renderer} />;
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
        case 'stake-eth-in-a-nutshell':
            return <StakeEthInANutshellModal onCancel={onCancel} />;
        case 'stake':
            return <StakeModal onCancel={onCancel} />;
        case 'unstake':
            return <UnstakeModal onCancel={onCancel} />;
        case 'claim':
            return <ClaimModal onCancel={onCancel} />;
        default:
            return null;
    }
};
