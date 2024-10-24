import { useSelector } from 'react-redux';
import { LayoutChangeEvent, View } from 'react-native';

import { getNetworkType, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { selectReviewSummaryOutput } from '../selectors';
import { ReviewOutputItemValues } from './ReviewOutputItemValues';
import { ReviewOutputCard } from './ReviewOutputCard';

type ReviewOutputSummaryItemProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
    onLayout: (event: LayoutChangeEvent) => void;
};

type EthereumValuesProps = {
    totalSpent: string;
    fee: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const BitcoinValues = ({ totalSpent, fee, networkSymbol }: EthereumValuesProps) => {
    return (
        <>
            <ReviewOutputItemValues
                value={totalSpent}
                networkSymbol={networkSymbol}
                translationKey="moduleSend.review.outputs.summary.totalAmount"
            />
            <ReviewOutputItemValues
                value={fee}
                networkSymbol={networkSymbol}
                translationKey="moduleSend.review.outputs.summary.fee"
            />
        </>
    );
};

const EthereumValues = ({ totalSpent, fee, tokenContract, networkSymbol }: EthereumValuesProps) => {
    const amount = tokenContract ? totalSpent : BigNumber(totalSpent).minus(fee).toString();

    return (
        <>
            <ReviewOutputItemValues
                value={String(Number(totalSpent) - Number(fee))}
                networkSymbol={networkSymbol}
                translationKey="moduleSend.review.outputs.summary.amount"
            />
            <ReviewOutputItemValues
                value={fee}
                networkSymbol={networkSymbol}
                translationKey="moduleSend.review.outputs.summary.maxFee"
            />
        </>
    );
};

export const ReviewOutputSummaryItem = ({
    accountKey,
    networkSymbol,
    onLayout,
}: ReviewOutputSummaryItemProps) => {
    const { translate } = useTranslate();
    const summaryOutput = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectReviewSummaryOutput(state, accountKey),
    );

    if (!summaryOutput) return null;

    const { state, totalSpent, fee } = summaryOutput;

    const isEthereumBasedNetwork = getNetworkType(networkSymbol) === 'ethereum';

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={translate('moduleSend.review.outputs.summary.label')}
                outputState={state}
            >
                <VStack spacing="sp16">
                    {isEthereumBasedNetwork ? (
                        <EthereumValues
                            totalSpent={totalSpent}
                            fee={fee}
                            networkSymbol={networkSymbol}
                        />
                    ) : (
                        <BitcoinValues
                            totalSpent={totalSpent}
                            fee={fee}
                            networkSymbol={networkSymbol}
                        />
                    )}
                </VStack>
            </ReviewOutputCard>
        </View>
    );
};
