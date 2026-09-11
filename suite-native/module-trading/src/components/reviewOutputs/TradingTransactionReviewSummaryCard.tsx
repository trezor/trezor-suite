import { type LayoutChangeEvent, View } from 'react-native';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type SendRootState, selectSendPrecomposedTx } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormDraftWithSendKeyPrefix,
    type TokenAddress,
    type TransactionReviewSummaryOutput,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import type { ExchangeFlowType } from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';
import {
    type TransactionReviewOutputsState,
    selectIsClearSignedTradingSwap,
} from '@suite-native/transaction-management';
import {
    TransactionReviewOutputCard,
    TransactionReviewOutputItemValues,
} from '@suite-native/transaction-review';
import { BigNumber } from '@trezor/utils';

export interface TradingTransactionReviewSummaryCardProps {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    onLayout: (event: LayoutChangeEvent) => void;
    tokenContract?: TokenAddress;
    summaryOutput?: TransactionReviewSummaryOutput;
    flowType?: ExchangeFlowType;
    prefix: FormDraftWithSendKeyPrefix;
}

type BitcoinValuesProps = {
    accountKey: AccountKey;
    totalSpent: string;
    fee: string;
};

type TokenEnabledValuesProps = {
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
    isClearSignedTradingSwap: boolean;
} & BitcoinValuesProps;

const BitcoinValues = ({ accountKey, totalSpent, fee }: BitcoinValuesProps) => (
    <>
        <TransactionReviewOutputItemValues
            accountKey={accountKey}
            value={totalSpent}
            translationKey="transactionManagement.review.outputs.summary.totalAmount"
        />
        <TransactionReviewOutputItemValues
            accountKey={accountKey}
            value={fee}
            translationKey="transactionManagement.review.outputs.summary.fee"
        />
    </>
);

const TokenEnabledValues = ({
    accountKey,
    totalSpent,
    fee,
    tokenContract,
    flowType,
    isClearSignedTradingSwap,
}: TokenEnabledValuesProps) => {
    let amount: string | undefined;

    if (!flowType || flowType === 'swap') {
        amount = tokenContract ? totalSpent : BigNumber(totalSpent).minus(fee).toString();
    }

    return (
        <>
            {!!amount && !isClearSignedTradingSwap && (
                <TransactionReviewOutputItemValues
                    accountKey={accountKey}
                    value={amount}
                    tokenContract={tokenContract}
                    translationKey="transactionManagement.review.outputs.summary.amount"
                />
            )}
            <TransactionReviewOutputItemValues
                accountKey={accountKey}
                value={fee}
                translationKey="transactionManagement.review.outputs.summary.maxFee"
            />
        </>
    );
};

export const TradingTransactionReviewSummaryCard = ({
    accountKey,
    symbol,
    onLayout,
    tokenContract,
    summaryOutput,
    flowType,
    prefix,
}: TradingTransactionReviewSummaryCardProps) => {
    const { translate } = useTranslate();

    const isClearSignedTradingSwap = useSelector((state: TransactionReviewOutputsState) =>
        selectIsClearSignedTradingSwap(state, accountKey, prefix),
    );
    const composedTokenContract = useSelector(
        (state: SendRootState) => selectSendPrecomposedTx(state)?.token?.contract,
    );
    const amountTokenContract =
        getNetwork(symbol).networkType === 'ethereum' ? composedTokenContract : tokenContract;

    if (!summaryOutput) {
        return null;
    }
    const { state, totalSpent, fee } = summaryOutput;
    const isNetworkSupportingTokens = isNetworkWithTokens(symbol);

    return (
        <View onLayout={onLayout}>
            <TransactionReviewOutputCard
                title={translate('transactionManagement.review.outputs.summary.label')}
                outputState={state}
            >
                <VStack spacing="sp16">
                    {isNetworkSupportingTokens ? (
                        <TokenEnabledValues
                            accountKey={accountKey}
                            totalSpent={totalSpent}
                            fee={fee}
                            tokenContract={
                                amountTokenContract
                                    ? toTokenAddress(amountTokenContract)
                                    : undefined
                            }
                            flowType={flowType}
                            isClearSignedTradingSwap={isClearSignedTradingSwap}
                        />
                    ) : (
                        <BitcoinValues accountKey={accountKey} totalSpent={totalSpent} fee={fee} />
                    )}
                </VStack>
            </TransactionReviewOutputCard>
        </View>
    );
};
