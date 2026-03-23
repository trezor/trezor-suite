import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type TransactionsRootState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { selectTransactionAddresses } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';

type VerticalSeparatorProps = { inputsCount: number };

const SEPARATOR_TOP_OFFSET = 37;
const SEPARATOR_LEFT_OFFSET = 7.5;
const SINGLE_INPUT_SEPARATOR_HEIGHT = 34;
const TWO_INPUTS_SEPARATOR_HEIGHT = 60;
const MULTIPLE_INPUT_SEPARATOR_HEIGHT = 90;

const separatorStyle = prepareNativeStyle<VerticalSeparatorProps>((utils, { inputsCount }) => ({
    position: 'absolute',
    left: SEPARATOR_LEFT_OFFSET,
    top: SEPARATOR_TOP_OFFSET,
    width: utils.borders.widths.small,
    height: SINGLE_INPUT_SEPARATOR_HEIGHT,
    backgroundColor: utils.colors.backgroundNeutralSubdued,

    extend: [
        {
            condition: inputsCount === 2,
            style: {
                height: TWO_INPUTS_SEPARATOR_HEIGHT,
            },
        },
        {
            // Two addresses are displayed at maximum, other is hidden behind `Show more` button.
            condition: inputsCount > 2,
            style: {
                height: MULTIPLE_INPUT_SEPARATOR_HEIGHT,
            },
        },
    ],
}));

export const VerticalSeparator = ({ inputsCount }: VerticalSeparatorProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(separatorStyle, { inputsCount })} />;
};

type NetworkTransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    onShowMore: () => void;
};

export const NetworkTransactionDetailSummary = ({
    accountKey,
    transaction,
    onShowMore,
}: NetworkTransactionDetailSummaryProps) => {
    const transactionInputAddresses = useSelector(
        (state: TransactionsRootState & TokenDefinitionsRootState) =>
            selectTransactionAddresses(state, accountKey, transaction.txid, 'inputs'),
    );
    const transactionOutputAddresses = useSelector(
        (state: TransactionsRootState & TokenDefinitionsRootState) =>
            selectTransactionAddresses(state, accountKey, transaction.txid, 'outputs'),
    );

    const isNonEmptyInput = A.isNotEmpty(transactionInputAddresses);
    const isNonEmptyOutput = A.isNotEmpty(transactionOutputAddresses);

    return (
        <VStack spacing="sp24">
            {isNonEmptyInput && (
                <TransactionDetailAddressesSection
                    addressesType="inputs"
                    addresses={transactionInputAddresses}
                    onShowMore={onShowMore}
                    transaction={transaction}
                />
            )}
            {isNonEmptyOutput && (
                <TransactionDetailAddressesSection
                    addressesType="outputs"
                    addresses={transactionOutputAddresses}
                    onShowMore={onShowMore}
                    transaction={transaction}
                />
            )}
            {isNonEmptyInput && isNonEmptyOutput && (
                <VerticalSeparator inputsCount={transactionInputAddresses.length} />
            )}
        </VStack>
    );
};
