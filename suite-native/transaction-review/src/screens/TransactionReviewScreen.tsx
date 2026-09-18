import { type ReactNode, type Ref, useEffect } from 'react';

import { Box, VStack } from '@suite-native/atoms';
import {
    type BottomSheetControlProps,
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    type CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TransactionReviewFooter } from '../components/TransactionReviewFooter';
import { TransactionReviewOutputsList } from '../components/TransactionReviewOutputsList';
import { TxValidityTimer } from '../components/TxValidityTimer';
import {
    TransactionReviewProvider,
    type TransactionReviewProviderProps,
    useTransactionReview,
} from '../hooks/useTransactionReview';
import { useTransactionReviewBackInterceptor } from '../hooks/useTransactionReviewBackInterceptor';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

const TransactionReviewSpacer = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(spacerStyle)} />;
};

interface TransactionReviewSheetController {
    confirmOnTrezorRef: Ref<BottomSheetControlProps>;
    revealConfirmOnTrezorSheet: () => void;
    closeSheet: () => void;
}

// The transaction-validity countdown (currently Solana-only) is flow-specific
// business logic — each flow builds it from useTxValidityTimer and injects it.
export type TransactionReviewTxValidityFlow = {
    showTimer: boolean;
    secondsLeft: number;
    isPastDeadline: boolean;
    isBroadcasting: boolean;
    onRetry: () => void;
    isRetryDisabled: boolean;
};

interface TransactionReviewScreenContentProps {
    children?: ReactNode;
    sheetController?: TransactionReviewSheetController;
    isManualSheetControlEnabled?: boolean;
    isBackInterceptorEnabled?: boolean;
    closeActionType?: CloseActionType;
    closeAction?: () => void;
    txValidityFlow?: TransactionReviewTxValidityFlow;
    testID?: string;
}

const TransactionReviewScreenContent = ({
    children,
    sheetController,
    isManualSheetControlEnabled = false,
    isBackInterceptorEnabled = true,
    closeActionType = 'close',
    closeAction,
    txValidityFlow,
    testID,
}: TransactionReviewScreenContentProps) => {
    const review = useTransactionReview();

    const internalSheetController = useConfirmOnTrezorController();
    const { confirmOnTrezorRef, closeSheet } = sheetController ?? internalSheetController;

    const navigateToInitialScreen = useNavigateToInitialScreen();

    useTransactionReviewBackInterceptor({
        isEnabled: isBackInterceptorEnabled,
        onReviewCanceled: navigateToInitialScreen,
    });

    const shouldShowFooter = !!review.account && review.isTransactionAlreadySigned;

    // A signed transaction whose validity window has expired must not be sent.
    // isPastDeadline is already network-gated (Solana-only) by useTxValidityTimer,
    // so no network check is needed here.
    const isSendButtonDisabled = !!review.isSendButtonDisabled || !!txValidityFlow?.isPastDeadline;

    useEffect(() => {
        if (shouldShowFooter) closeSheet();
    }, [closeSheet, shouldShowFooter]);

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            isManualControlEnabled={isManualSheetControlEnabled}
            closeActionType={closeActionType}
            closeAction={closeAction}
            defaultHeader={
                <ScreenHeader
                    title={<Translation id={review.titleTranslationId} />}
                    closeActionType={closeActionType}
                    closeAction={closeAction}
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between" testID={testID}>
                <VStack spacing="sp16">
                    {!!txValidityFlow?.showTimer && (
                        <TxValidityTimer
                            secondsLeft={txValidityFlow.secondsLeft}
                            isPastDeadline={txValidityFlow.isPastDeadline}
                            isBroadcasting={txValidityFlow.isBroadcasting}
                            onRetry={txValidityFlow.onRetry}
                            isRetryDisabled={txValidityFlow.isRetryDisabled}
                        />
                    )}

                    {review.renderOutputsList ? (
                        review.renderOutputsList()
                    ) : (
                        <TransactionReviewOutputsList />
                    )}
                </VStack>

                {shouldShowFooter ? (
                    <TransactionReviewFooter isSendButtonDisabled={isSendButtonDisabled} />
                ) : (
                    <TransactionReviewSpacer />
                )}
            </VStack>

            {children}
        </ConfirmOnTrezorWrapper>
    );
};

type TransactionReviewScreenProps = Omit<TransactionReviewProviderProps, 'children'> &
    TransactionReviewScreenContentProps;

export const TransactionReviewScreen = ({
    children,
    sheetController,
    isManualSheetControlEnabled,
    isBackInterceptorEnabled,
    closeActionType,
    closeAction,
    txValidityFlow,
    testID,
    ...providerProps
}: TransactionReviewScreenProps) => (
    <TransactionReviewProvider {...providerProps}>
        <TransactionReviewScreenContent
            sheetController={sheetController}
            isManualSheetControlEnabled={isManualSheetControlEnabled}
            isBackInterceptorEnabled={isBackInterceptorEnabled}
            closeActionType={closeActionType}
            closeAction={closeAction}
            txValidityFlow={txValidityFlow}
            testID={testID}
        >
            {children}
        </TransactionReviewScreenContent>
    </TransactionReviewProvider>
);
