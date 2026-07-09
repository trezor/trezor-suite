import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    Box,
    Button,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/confirm-on-trezor';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation, useTranslate } from '@suite-native/intl';

import { TransactionDetailRow } from './TransactionDetailRow';
import { useCancelEvmTransaction } from '../hooks/useCancelEvmTransaction';

type CancelEvmTransactionButtonProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
};

type CancelTransactionFeeRowProps = {
    title: string;
    fee: string;
    symbol: WalletAccountTransaction['symbol'];
};

const CancelTransactionFeeRow = ({ title, fee, symbol }: CancelTransactionFeeRowProps) => (
    <TransactionDetailRow title={title}>
        <Box alignItems="flex-end">
            <CryptoAmountFormatter
                value={fee}
                symbol={symbol}
                variant="body-sm"
                color="contentPrimary"
                isBalance={false}
            />
            <CryptoToFiatAmountFormatter
                value={fee}
                symbol={symbol}
                variant="body-sm"
                color="contentSecondary"
            />
        </Box>
    </TransactionDetailRow>
);

export const CancelEvmTransactionButton = ({
    accountKey,
    transaction,
}: CancelEvmTransactionButtonProps) => {
    const { translate } = useTranslate();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const {
        isCancellable,
        composeCancelTx,
        composedCancelTx,
        composeError,
        isComposing,
        confirmCancellation,
        isSigning,
        isWaitingForDevice,
    } = useCancelEvmTransaction({ accountKey, transaction, onClose: closeModal });

    if (!isCancellable) return null;

    const handleOpenSheet = () => {
        composeCancelTx();
        openModal();
    };

    return (
        <>
            <Button
                iconRight="x"
                intent="critical"
                priority="secondary"
                onPress={handleOpenSheet}
                testID="@transaction-detail/cancel-transaction-button"
            >
                <Translation id="transactions.detail.cancelTransaction.button" />
            </Button>

            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="transactions.detail.cancelTransaction.sheetTitle" />}
                onClose={closeModal}
            >
                {isWaitingForDevice ? (
                    <VStack spacing="sp16" alignItems="center" paddingBottom="sp16">
                        <ConfirmOnTrezorAnimation />
                        <Text variant="body-md" color="contentSecondary" textAlign="center">
                            <Translation id="transactions.detail.cancelTransaction.confirmOnDevice" />
                        </Text>
                    </VStack>
                ) : (
                    <VStack spacing="sp24" paddingBottom="sp16">
                        <Text variant="body-md" color="contentSecondary">
                            <Translation id="transactions.detail.cancelTransaction.notice" />
                        </Text>

                        {composeError && (
                            <Text variant="body-md" color="contentCritical">
                                <Translation id="transactions.detail.cancelTransaction.composeErrorMessage" />
                            </Text>
                        )}

                        {composedCancelTx !== null && (
                            <VStack spacing="sp16">
                                <CancelTransactionFeeRow
                                    title={translate(
                                        'transactions.detail.cancelTransaction.originalFeeLabel',
                                    )}
                                    fee={transaction.fee}
                                    symbol={transaction.symbol}
                                />
                                <CancelTransactionFeeRow
                                    title={translate(
                                        'transactions.detail.cancelTransaction.newFeeLabel',
                                    )}
                                    fee={composedCancelTx.fee}
                                    symbol={transaction.symbol}
                                />
                            </VStack>
                        )}

                        <Button
                            intent="critical"
                            onPress={confirmCancellation}
                            isLoading={isComposing || isSigning}
                            isDisabled={
                                composedCancelTx === null ||
                                composeError ||
                                isComposing ||
                                isSigning
                            }
                            testID="@transaction-detail/confirm-cancel-transaction-button"
                        >
                            <Translation id="transactions.detail.cancelTransaction.confirmButton" />
                        </Button>
                    </VStack>
                )}
            </BottomSheetModal>
        </>
    );
};
