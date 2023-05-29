import React from 'react';
import { onCancel as onCancelAction } from '@suite-actions/modalActions';
import { MODAL } from '@suite-actions/constants';
import { useActions } from '@suite-hooks';
import {
    PinMismatch,
    PassphraseDuplicate,
    CoinmarketTermsModal,
    CoinmarketLeaveSpend,
    ConfirmAddress,
    ConfirmXpub,
    ReviewTransaction,
    ImportTransaction,
    AddAccount,
    QrScanner,
    BackgroundGallery,
    TransactionDetail,
    ApplicationLog,
    WipeDevice,
    MetadataProvider,
    AdvancedCoinSettings,
    AddToken,
    SafetyChecks,
    DisableTor,
    RequestEnableTor,
    TorLoading,
    CancelCoinjoin,
    CriticalCoinjoinPhase,
    CoinjoinSuccess,
    MoreRoundsNeeded,
    ConfirmUnverified,
} from '@suite-components/modals';

import type { AcquiredDevice } from '@suite-types';
import type { ReduxModalProps } from './types';
import { DisableTorStopCoinjoin } from '@suite-components/modals/DisableTorStopCoinjoin';
import { UnecoCoinjoinWarning } from '@suite-components/modals/UnecoCoinjoinWarning';
import { openXpubModal, showXpub } from '@wallet-actions/publicKeyActions';
import { showAddress, showUnverifiedAddress } from '@wallet-actions/receiveActions';

/** Modals opened as a result of user action */
export const UserContextModal = ({
    payload,
    renderer,
}: ReduxModalProps<typeof MODAL.CONTEXT_USER>) => {
    const { onCancel } = useActions({ onCancel: onCancelAction });
    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccount
                    device={payload.device as AcquiredDevice}
                    symbol={payload.symbol}
                    noRedirect={payload.noRedirect}
                    onCancel={onCancel}
                />
            );
        case 'unverified-address':
            return (
                <ConfirmUnverified
                    showUnverifiedButtonText="TR_SHOW_UNVERIFIED_ADDRESS"
                    warningText="TR_ADDRESS_PHISHING_WARNING"
                    verify={() => showAddress(payload.addressPath, payload.value)}
                    showUnverified={() => showUnverifiedAddress(payload.addressPath, payload.value)}
                    onCancel={onCancel}
                />
            );
        case 'unverified-xpub':
            return (
                <ConfirmUnverified
                    showUnverifiedButtonText="TR_SHOW_UNVERIFIED_XPUB"
                    warningText="TR_XPUB_PHISHING_WARNING"
                    verify={showXpub}
                    showUnverified={() => openXpubModal({ isCancelable: true })}
                    onCancel={onCancel}
                />
            );
        case 'address':
            return (
                <ConfirmAddress
                    {...payload}
                    onCancel={payload.isCancelable ? onCancel : undefined}
                />
            );
        case 'xpub':
            return <ConfirmXpub {...payload} onCancel={onCancel} />;
        case 'device-background-gallery':
            return <BackgroundGallery onCancel={onCancel} />;
        case 'wipe-device':
            return <WipeDevice onCancel={onCancel} />;
        case 'qr-reader':
            return (
                <QrScanner
                    decision={payload.decision}
                    allowPaste={payload.allowPaste}
                    onCancel={onCancel}
                />
            );
        case 'transaction-detail':
            return <TransactionDetail {...payload} onCancel={onCancel} />;
        case 'passphrase-duplicate':
            return <PassphraseDuplicate device={payload.device} duplicate={payload.duplicate} />;
        case 'review-transaction':
            return <ReviewTransaction {...payload} />;
        case 'coinmarket-leave-spend':
            return <CoinmarketLeaveSpend {...payload} onCancel={onCancel} />;
        case 'coinmarket-buy-terms': {
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="BUY"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency}
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
                    cryptoCurrency={payload.cryptoCurrency}
                />
            );

        case 'coinmarket-exchange-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="EXCHANGE"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency}
                    fromCryptoCurrency={payload.fromCryptoCurrency}
                />
            );
        case 'coinmarket-exchange-dex-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="EXCHANGE_DEX"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency}
                    fromCryptoCurrency={payload.fromCryptoCurrency}
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
                    cryptoCurrency={payload.cryptoCurrency}
                />
            );
        case 'import-transaction':
            return <ImportTransaction {...payload} onCancel={onCancel} />;
        case 'pin-mismatch':
            return <PinMismatch renderer={renderer} />;
        case 'application-log':
            return <ApplicationLog onCancel={onCancel} />;
        case 'metadata-provider':
            return <MetadataProvider onCancel={onCancel} decision={payload.decision} />;
        case 'advanced-coin-settings':
            return <AdvancedCoinSettings {...payload} onCancel={onCancel} />;
        case 'add-token':
            return <AddToken {...payload} onCancel={onCancel} />;
        case 'safety-checks':
            return <SafetyChecks onCancel={onCancel} />;
        case 'disable-tor':
            return <DisableTor decision={payload.decision} onCancel={onCancel} />;
        case 'request-enable-tor':
            return <RequestEnableTor decision={payload.decision} onCancel={onCancel} />;
        case 'disable-tor-stop-coinjoin':
            return <DisableTorStopCoinjoin decision={payload.decision} onCancel={onCancel} />;
        case 'tor-loading':
            return <TorLoading decision={payload.decision} onCancel={onCancel} />;
        case 'cancel-coinjoin':
            return <CancelCoinjoin onClose={onCancel} />;
        case 'critical-coinjoin-phase':
            return <CriticalCoinjoinPhase relatedAccountKey={payload.relatedAccountKey} />;
        case 'coinjoin-success':
            return <CoinjoinSuccess relatedAccountKey={payload.relatedAccountKey} />;
        case 'more-rounds-needed':
            return <MoreRoundsNeeded />;
        case 'uneco-coinjoin-warning':
            return <UnecoCoinjoinWarning />;

        default:
            return null;
    }
};
