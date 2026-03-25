import { useDispatch, useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    type PhishingDetectorId,
    type TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import {
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    selectBaseCurrency,
    selectHistoricFiatRatesByTimestamp,
    selectIsPhishingTransaction,
    selectTransactionBlockTimeById,
    selectTransactionIsMarkedAsNotScam,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type AccountKey, type Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Box, Card, FullAlertBox, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';

import { TransactionDetailIncludedCoins } from './TransactionDetailIncludedCoins';
import { TransactionDetailRow } from './TransactionDetailRow';
import { TransactionDetailSheets } from './TransactionDetailSheets';
import { TransactionOverview, cardStyle } from './TransactionOverview';

const getPhishingWarningTranslationId = (detectorId?: PhishingDetectorId) => {
    switch (detectorId) {
        case 'FAKE_TOKEN':
            return 'transactions.phishing.warningFakeToken';
        case 'UNKNOWN_TX':
            return 'transactions.phishing.warningUnknownTx';
        case 'DUST_AMOUNT':
            return 'transactions.phishing.warningDustAmount';
        case 'ZERO_AMOUNT':
            return 'transactions.phishing.warningZeroAmount';
        default:
            return 'transactions.phishing.warning';
    }
};

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer?: TypedTokenTransfer;
};

export const TransactionDetailData = ({
    transaction,
    accountKey,
    tokenTransfer,
}: TransactionDetailDataProps) => {
    const dispatch = useDispatch();

    const { DateFormatter, TimeFormatter } = useFormatters();
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const inputsSheetControls = useBottomSheetModal();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, accountKey, transaction.txid),
    );
    const { isPhishing: isPhishingTransaction, detectorId: phishingDetectorId } = useSelector(
        (
            state: TokenDefinitionsRootState &
                TransactionsRootState &
                FiatRatesRootState &
                PhishingRootState,
        ) => selectIsPhishingTransaction(state, transaction.txid, accountKey),
    );

    const isTxMarkedAsNotScam = useSelector((state: TransactionsRootState) =>
        selectTransactionIsMarkedAsNotScam(state, transaction.txid, accountKey),
    );

    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    const transactionTokensCount = transaction.tokens.length;

    const isTokenTransaction = !!tokenTransfer;
    const isMultiTokenTransaction = isTokenTransaction && transactionTokensCount - 1 > 0;
    const isNetworkTransactionWithTokens = !isTokenTransaction && transactionTokensCount > 0;

    const hasIncludedCoins = isMultiTokenTransaction || isNetworkTransactionWithTokens;

    const onMarkTxAsNotScamPress = () => {
        dispatch(
            transactionsActions.markTransactionAsNotScam({
                key: accountKey,
                txid: transaction.txid,
                isMarkedAsNotScam: true,
            }),
        );
    };

    const onUnmarkTxAsNotScamPress = () => {
        dispatch(
            transactionsActions.markTransactionAsNotScam({
                key: accountKey,
                txid: transaction.txid,
                isMarkedAsNotScam: false,
            }),
        );
    };

    const onLearnMorePress = () => {
        openLink(HELP_CENTER_ZERO_VALUE_ATTACKS);
    };

    return (
        <VStack spacing="sp16">
            {isPhishingTransaction && (
                <FullAlertBox
                    variant="warning"
                    title={<Translation id={getPhishingWarningTranslationId(phishingDetectorId)} />}
                    primaryButtonLabel={
                        <Translation id="transactions.phishing.unhideTransaction" />
                    }
                    primaryButtonProps={{
                        onPress: onMarkTxAsNotScamPress,
                    }}
                    secondaryButtonLabel={<Translation id="generic.buttons.learnMore" />}
                    secondaryButtonProps={{
                        onPress: onLearnMorePress,
                    }}
                />
            )}

            {!isPhishingTransaction && isTxMarkedAsNotScam && (
                <FullAlertBox
                    variant="info"
                    title={<Translation id="transactions.phishing.markedAsRecognized" />}
                    primaryButtonProps={{
                        onPress: onUnmarkTxAsNotScamPress,
                    }}
                    primaryButtonLabel={<Translation id="transactions.phishing.hideTransaction" />}
                    secondaryButtonLabel={<Translation id="generic.buttons.learnMore" />}
                    secondaryButtonProps={{
                        onPress: onLearnMorePress,
                    }}
                />
            )}

            <Card borderColor="borderElevation1" style={applyStyle(cardStyle)}>
                <VStack spacing="sp24">
                    <TransactionDetailRow title={translate('transactions.detail.feeLabel')}>
                        <Box alignItems="flex-end">
                            <CryptoAmountFormatter
                                value={transaction.fee}
                                symbol={transaction.symbol}
                                variant="body-sm"
                                color="textDefault"
                                isBalance={false}
                            />
                            {historicRate !== undefined && historicRate !== 0 && (
                                <Box flexDirection="row">
                                    <CryptoToFiatAmountFormatter
                                        value={transaction.fee}
                                        symbol={transaction.symbol}
                                        historicRate={historicRate}
                                        useHistoricRate
                                        variant="body-sm"
                                        color="textSubdued"
                                    />
                                </Box>
                            )}
                        </Box>
                    </TransactionDetailRow>
                    {transactionBlockTime && (
                        <>
                            <TransactionDetailRow
                                title={translate('transactions.detail.dateLabel')}
                            >
                                <Box alignItems="flex-end">
                                    <Text variant="body-sm">
                                        <DateFormatter value={transactionBlockTime} />
                                    </Text>
                                    <Text variant="body-sm" color="textSubdued">
                                        <TimeFormatter value={transactionBlockTime} />
                                    </Text>
                                </Box>
                            </TransactionDetailRow>
                        </>
                    )}
                </VStack>
            </Card>
            <TransactionOverview
                transaction={transaction}
                accountKey={accountKey}
                tokenTransfer={tokenTransfer}
                onShowMore={inputsSheetControls.openModal}
            />
            {hasIncludedCoins && (
                <TransactionDetailIncludedCoins
                    accountKey={accountKey}
                    transaction={transaction}
                    tokenTransfer={tokenTransfer}
                />
            )}

            <TransactionDetailSheets
                transaction={transaction}
                isTokenTransaction={isTokenTransaction}
                accountKey={accountKey}
                inputsSheetControls={inputsSheetControls}
            />
        </VStack>
    );
};
