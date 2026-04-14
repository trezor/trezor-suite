import { type LayoutChangeEvent, View } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import type { ExchangeFlowType } from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';
import { BigNumber } from '@trezor/utils';

import { ReviewOutputCard } from './ReviewOutputCard';
import { ReviewOutputItemValues } from './ReviewOutputItemValues';
import { type ReviewSummaryOutput } from '../../types';

export type ReviewOutputSummaryItemProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    onLayout: (event: LayoutChangeEvent) => void;
    tokenContract?: TokenAddress;
    summaryOutput?: ReviewSummaryOutput;
    flowType?: ExchangeFlowType;
};

type BitcoinValuesProps = {
    accountKey: AccountKey;
    totalSpent: string;
    fee: string;
};

type TokenEnabledValuesProps = {
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
} & BitcoinValuesProps;

const BitcoinValues = ({ accountKey, totalSpent, fee }: BitcoinValuesProps) => (
    <>
        <ReviewOutputItemValues
            accountKey={accountKey}
            value={totalSpent}
            translationKey="transactionManagement.review.outputs.summary.totalAmount"
        />
        <ReviewOutputItemValues
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
}: TokenEnabledValuesProps) => {
    let amount: string | undefined;

    if (flowType !== 'approve' && flowType !== 'revoke') {
        amount = tokenContract ? totalSpent : BigNumber(totalSpent).minus(fee).toString();
    }

    return (
        <>
            {!!amount && (
                <ReviewOutputItemValues
                    accountKey={accountKey}
                    value={amount}
                    tokenContract={tokenContract}
                    translationKey="transactionManagement.review.outputs.summary.amount"
                />
            )}
            <ReviewOutputItemValues
                accountKey={accountKey}
                value={fee}
                translationKey="transactionManagement.review.outputs.summary.maxFee"
            />
        </>
    );
};

export const ReviewOutputSummaryItem = ({
    accountKey,
    symbol,
    onLayout,
    tokenContract,
    summaryOutput,
    flowType,
}: ReviewOutputSummaryItemProps) => {
    const { translate } = useTranslate();

    if (!summaryOutput) return null;

    const { state, totalSpent, fee } = summaryOutput;

    const isNetworkSupportingTokens = isNetworkWithTokens(symbol);

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('transactionManagement.review.outputs.summary.label')}
                outputState={state}
            >
                <VStack spacing="sp16">
                    {isNetworkSupportingTokens ? (
                        <TokenEnabledValues
                            accountKey={accountKey}
                            totalSpent={totalSpent}
                            fee={fee}
                            tokenContract={tokenContract}
                            flowType={flowType}
                        />
                    ) : (
                        <BitcoinValues accountKey={accountKey} totalSpent={totalSpent} fee={fee} />
                    )}
                </VStack>
            </ReviewOutputCard>
        </View>
    );
};
