import { useSelector } from 'react-redux';

import { ErrorMessage, Loader, Text } from '@suite-native/atoms';
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

    // TODO: wait for device access with loader or something?
    if (!account) return <ErrorMessage errorMessage="Account not found." />;

    if (!precomposedTx) return <Loader title="Wait a sec..." />;

    const { fee, totalSpent } = precomposedTx;

    // TODO: proper UI when is design ready
    return (
        <>
            <Text textAlign="center">{account.accountLabel}</Text>
            <Text textAlign="center">Compare these values with those on Trezor device:</Text>
            {reviewOutputs?.map(output => (
                <ReviewOutputItem
                    networkSymbol={account.symbol}
                    key={output.value}
                    reviewOutput={output}
                    status="active"
                />
            ))}
            {totalSpent && (
                <>
                    <Text textAlign="center">Total amount:</Text>
                    <CryptoAmountFormatter
                        color="textDefault"
                        variant="body"
                        isBalance={false}
                        value={totalSpent}
                        network={account.symbol}
                    />
                </>
            )}
            {fee && (
                <>
                    <Text textAlign="center">Including fee:</Text>
                    <CryptoAmountFormatter
                        color="textDefault"
                        variant="body"
                        isBalance={false}
                        value={fee}
                        network={account.symbol}
                    />
                </>
            )}
        </>
    );
};
