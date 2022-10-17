import React from 'react';
import { onCancel as onCancelAction } from '@suite-actions/modalActions';
import { MODAL } from '@suite-actions/constants';
import { useActions } from '@suite-hooks';
import {
    PinMismatch,
    PassphraseDuplicate,
    CoinmarketBuyTerms,
    CoinmarketSavingsTerms,
    CoinmarketSellTerms,
    CoinmarketExchangeTerms,
    CoinmarketExchangeDexTerms,
    CoinmarketLeaveSpend,
    CoinmarketP2pTerms,
    ConfirmAddress,
    ConfirmXpub,
    ReviewTransaction,
    ImportTransaction,
    ConfirmUnverifiedAddress,
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
    AccessCoinjoinAccount,
} from '@suite-components/modals';

import type { AcquiredDevice } from '@suite-types';
import type { ReduxModalProps } from './types';

/** Modals opened as result of user action */
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
            return <ConfirmUnverifiedAddress {...payload} onCancel={onCancel} />;
        case 'address':
            return (
                <ConfirmAddress {...payload} onCancel={payload.cancelable ? onCancel : undefined} />
            );
        case 'xpub':
            return <ConfirmXpub {...payload} onCancel={onCancel} />;
        case 'device-background-gallery':
            return (
                <BackgroundGallery device={payload.device as AcquiredDevice} onCancel={onCancel} />
            );
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
        case 'coinmarket-buy-terms':
            return (
                <CoinmarketBuyTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-sell-terms':
            return (
                <CoinmarketSellTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-exchange-terms':
            return (
                <CoinmarketExchangeTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-exchange-dex-terms':
            return (
                <CoinmarketExchangeDexTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-p2p-terms':
            return (
                <CoinmarketP2pTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-savings-terms':
            return (
                <CoinmarketSavingsTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
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
        case 'tor-loading':
            return <TorLoading decision={payload.decision} onCancel={onCancel} />;
        case 'access-coinjoin-account':
            return (
                <AccessCoinjoinAccount
                    network={payload.network}
                    decision={payload.decision}
                    onCancel={onCancel}
                />
            );
        case 'cancel-coinjoin':
            return <CancelCoinjoin onClose={onCancel} />;
        case 'critical-coinjoin-phase':
            return <CriticalCoinjoinPhase relatedAccountKey={payload.relatedAccountKey} />;

        default:
            return null;
    }
};
