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
import { useTxValidityFlow } from '../hooks/useTxValidityFlow';

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

type TransactionReviewTxValidityFlow = ReturnType<typeof useTxValidityFlow>;

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

export const TransactionReviewScreenContent = ({
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
    const { confirmOnTrezorRef, closeSheet, revealConfirmOnTrezorSheet } =
        sheetController ?? internalSheetController;

    const navigateToInitialScreen = useNavigateToInitialScreen();

    useTransactionReviewBackInterceptor({
        isEnabled: isBackInterceptorEnabled,
        onReviewCanceled: navigateToInitialScreen,
    });

    const internalTxValidityFlow = useTxValidityFlow({
        accountKey: review.accountKey,
        tokenContract: review.tokenContract,
        revealConfirmOnTrezorSheet,
        isSendInProgress: review.isSending,
        isEnabled: !txValidityFlow,
    });

    const activeTxValidityFlow = txValidityFlow ?? internalTxValidityFlow;

    const shouldShowFooter = !!review.account && review.isTransactionAlreadySigned;

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
                    {activeTxValidityFlow.showTimer && (
                        <TxValidityTimer {...activeTxValidityFlow} />
                    )}

                    {review.renderOutputsList ? (
                        review.renderOutputsList()
                    ) : (
                        <TransactionReviewOutputsList />
                    )}
                </VStack>

                {shouldShowFooter ? <TransactionReviewFooter /> : <TransactionReviewSpacer />}
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
