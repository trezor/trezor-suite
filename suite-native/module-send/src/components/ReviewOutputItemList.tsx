import { useSelector } from 'react-redux';

import { ErrorMessage, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    SendRootState,
    selectAccountByKey,
    selectSendPrecomposedTx,
} from '@suite-common/wallet-core';
import { CryptoAmountFormatter } from '@suite-native/formatters';

import { ReviewOutputItem } from './ReviewOutputItem';
import { selectTransactionReviewOutputs } from '../selectors';

type ReviewOutputItemListProps = { accountKey: AccountKey };

export const ReviewOutputItemList = ({ accountKey }: ReviewOutputItemListProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const reviewOutputs = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectTransactionReviewOutputs(state, accountKey),
    );

    const precomposedTx = useSelector(selectSendPrecomposedTx);

    if (!account || !precomposedTx)
        return <ErrorMessage errorMessage="Account or precomposed transaction not found." />;

    const { fee, totalSpent } = precomposedTx;

    // TODO: proper UI when is design ready
    return (
        <>
            <Text textAlign="center">{account.accountLabel}</Text>
            <Text textAlign="center">Compare these values with those on Trezor device:</Text>
            {reviewOutputs?.map(output => {
                return (
                    <ReviewOutputItem
                        networkSymbol={account.symbol}
                        key={output.value}
                        reviewOutput={output}
                        status="active"
                    />
                );
            })}
            {fee && (
                <>
                    <Text textAlign="center">fee:</Text>
                    <CryptoAmountFormatter
                        color="textDefault"
                        variant="body"
                        isBalance={false}
                        value={fee}
                        network={account.symbol}
                    />
                </>
            )}
            {totalSpent && (
                <>
                    <Text textAlign="center">Total spent:</Text>
                    <CryptoAmountFormatter
                        color="textDefault"
                        variant="body"
                        isBalance={false}
                        value={totalSpent}
                        network={account.symbol}
                    />
                </>
            )}
        </>
    );
};
