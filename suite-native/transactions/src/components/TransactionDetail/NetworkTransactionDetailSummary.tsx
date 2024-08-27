import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    TransactionsRootState,
    selectTransactionByTxidAndAccountKey,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Box, ErrorMessage, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectTransactionAddresses } from '../../selectors';
import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';

type VerticalSeparatorProps = { isMultiInputTransaction: boolean };

const SEPARATOR_TOP_OFFSET = 37;
const SEPARATOR_LEFT_OFFSET = 7.5;
const SINGLE_INPUT_SEPARATOR_HEIGHT = 34;
const MULTIPLE_INPUT_SEPARATOR_HEIGHT = 90;

const separatorStyle = prepareNativeStyle<VerticalSeparatorProps>(
    (utils, { isMultiInputTransaction }) => ({
        position: 'absolute',
        left: SEPARATOR_LEFT_OFFSET,
        top: SEPARATOR_TOP_OFFSET,
        width: utils.borders.widths.small,
        height: isMultiInputTransaction
            ? MULTIPLE_INPUT_SEPARATOR_HEIGHT
            : SINGLE_INPUT_SEPARATOR_HEIGHT,
        backgroundColor: utils.colors.backgroundNeutralSubdued,
    }),
);

export const VerticalSeparator = ({ isMultiInputTransaction }: VerticalSeparatorProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(separatorStyle, { isMultiInputTransaction })} />;
};

export const NetworkTransactionDetailSummary = ({
    accountKey,
    txid,
    onShowMore,
}: {
    accountKey: AccountKey;
    txid: string;
    onShowMore: () => void;
}) => {
    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByTxidAndAccountKey(state, txid, accountKey),
    );
    const transactionInputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'inputs'),
    );
    const transactionOutputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'outputs'),
    );

    if (!transaction) {
        return <ErrorMessage errorMessage="Target or Origin of transaction is unknown." />;
    }

    return (
        <VStack spacing="large">
            {A.isNotEmpty(transactionInputAddresses) && (
                <TransactionDetailAddressesSection
                    addressesType="inputs"
                    addresses={transactionInputAddresses}
                    onShowMore={onShowMore}
                    icon={transaction.symbol}
                />
            )}
            {A.isNotEmpty(transactionOutputAddresses) && (
                <TransactionDetailAddressesSection
                    addressesType="outputs"
                    addresses={transactionOutputAddresses}
                    onShowMore={onShowMore}
                />
            )}
            <VerticalSeparator isMultiInputTransaction={transactionInputAddresses.length > 1} />
        </VStack>
    );
};
