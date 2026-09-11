import { Box, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { useEffect } from 'react';
import { TransactionReviewFooter } from '../components/TransactionReviewFooter';
import { TransactionReviewOutputsList } from '../components/TransactionReviewOutputsList';
import { TxValidityTimer } from '../components/TxValidityTimer';
import {
    TransactionReviewProvider,
    TransactionReviewProviderProps,
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

export const TransactionReviewScreenContent = () => {
    const review = useTransactionReview();

    const { confirmOnTrezorRef, closeSheet, revealConfirmOnTrezorSheet } =
        useConfirmOnTrezorController();

    const navigateToInitialScreen = useNavigateToInitialScreen();
    useTransactionReviewBackInterceptor(navigateToInitialScreen);

    const txValidityFlow = useTxValidityFlow({
        accountKey: review.accountKey,
        tokenContract: review.tokenContract,
        revealConfirmOnTrezorSheet,
        isSendInProgress: review.isSending,
    });

    const shouldShowFooter = !!review.account && review.isTransactionAlreadySigned;

    useEffect(() => {
        if (shouldShowFooter) closeSheet();
    }, [closeSheet, shouldShowFooter]);

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    title={<Translation id={review.titleTranslationId} />}
                    closeActionType="close"
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                <VStack spacing="sp16">
                    {txValidityFlow.showTimer && <TxValidityTimer {...txValidityFlow} />}

                    <TransactionReviewOutputsList />
                </VStack>

                {shouldShowFooter ? <TransactionReviewFooter /> : <TransactionReviewSpacer />}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

type TransactionReviewScreenProps = Omit<TransactionReviewProviderProps, 'children'>;

export const TransactionReviewScreen = (props: TransactionReviewScreenProps) => {
    return (
        <TransactionReviewProvider {...props}>
            <TransactionReviewScreenContent />
        </TransactionReviewProvider>
    );
};
