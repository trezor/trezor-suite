import { useSelector } from 'react-redux';
import { LayoutChangeEvent, View } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';
import { isCoinWithTokens } from '@suite-native/tokens';

import { selectReviewSummaryOutput } from '../selectors';
import { ReviewOutputItemValues } from './ReviewOutputItemValues';
import { ReviewOutputCard } from './ReviewOutputCard';

type ReviewOutputSummaryItemProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    onLayout: (event: LayoutChangeEvent) => void;
    tokenContract?: TokenAddress;
};

type BitcoinValuesProps = {
    totalSpent: string;
    fee: string;
};

type TokenEnabledValuesProps = {
    tokenContract?: TokenAddress;
} & BitcoinValuesProps;

const BitcoinValues = ({ totalSpent, fee }: BitcoinValuesProps) => (
    <>
        <ReviewOutputItemValues
            value={totalSpent}
            translationKey="moduleSend.review.outputs.summary.totalAmount"
        />
        <ReviewOutputItemValues
            value={fee}
            translationKey="moduleSend.review.outputs.summary.fee"
        />
    </>
);

const TokenEnabledValues = ({ totalSpent, fee, tokenContract }: TokenEnabledValuesProps) => {
    const amount = tokenContract ? totalSpent : BigNumber(totalSpent).minus(fee).toString();

    return (
        <>
            <ReviewOutputItemValues
                value={amount}
                tokenContract={tokenContract}
                translationKey="moduleSend.review.outputs.summary.amount"
            />
            <ReviewOutputItemValues
                value={fee}
                translationKey="moduleSend.review.outputs.summary.maxFee"
            />
        </>
    );
};

export const ReviewOutputSummaryItem = ({
    accountKey,
    symbol,
    tokenContract,
    onLayout,
}: ReviewOutputSummaryItemProps) => {
    const { translate } = useTranslate();
    const summaryOutput = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectReviewSummaryOutput(state, accountKey, tokenContract),
    );

    if (!summaryOutput) return null;

    const { state, totalSpent, fee } = summaryOutput;

    const canHaveTokens = isCoinWithTokens(symbol);

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('moduleSend.review.outputs.summary.label')}
                outputState={state}
            >
                <VStack spacing="sp16">
                    {canHaveTokens ? (
                        <TokenEnabledValues
                            totalSpent={totalSpent}
                            fee={fee}
                            tokenContract={tokenContract}
                        />
                    ) : (
                        <BitcoinValues totalSpent={totalSpent} fee={fee} />
                    )}
                </VStack>
            </ReviewOutputCard>
        </View>
    );
};
