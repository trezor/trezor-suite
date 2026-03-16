import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type TransactionsRootState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type TransactionTranfer,
    selectTransactionInputAndOutputTransfers,
} from '@suite-native/transactions';

import { TransactionDetailInputsSheetSection } from './TransactionDetailInputsSheetSection';
import { type SheetControls, TransactionDetailSheet } from './TransactionDetailSheet';

type TransactionDetailInputsSheetProps = {
    txid: string;
    accountKey: AccountKey;
    sheetControls?: SheetControls;
};

type InputsOutputsHeaderProps = {
    inputsCount: number;
    outputsCount: number;
};

const InputsOutputsHeader = ({ inputsCount, outputsCount }: InputsOutputsHeaderProps) => (
    <Box flexDirection="row" justifyContent="space-between" marginBottom="sp16">
        <Box flex={1} flexDirection="row" alignItems="center" paddingLeft="sp8">
            <Text variant="body-sm" color="textSubdued">
                <Translation
                    id="transactions.TransactionDetailScreen.inputsSheet.inputs"
                    values={{ inputsCount: `· ${inputsCount}` }}
                />
            </Text>
            <Box marginLeft="sp8">
                <Icon name="arrowLineDown" color="iconSubdued" size="medium" />
            </Box>
        </Box>

        <Box flex={1} flexDirection="row" alignItems="center" paddingLeft="sp24">
            <Text variant="body-sm" color="textSubdued">
                <Translation
                    id="transactions.TransactionDetailScreen.inputsSheet.outputs"
                    values={{ outputsCount: `· ${outputsCount}` }}
                />
            </Text>
            <Box marginLeft="sp8">
                <Icon name="arrowLineUp" color="iconSubdued" size="medium" />
            </Box>
        </Box>
    </Box>
);

const getTransactionInputsAndOutputsCount = (transfers: TransactionTranfer[]) =>
    transfers.reduce(
        (accumulator, { inputs, outputs }) => {
            accumulator.inputsCount += inputs.length;
            accumulator.outputsCount += outputs.length;

            return accumulator;
        },
        { inputsCount: 0, outputsCount: 0 },
    );

export const TransactionDetailInputsSheet = ({
    txid,
    accountKey,
    sheetControls,
}: TransactionDetailInputsSheetProps) => {
    const { translate } = useTranslate();
    const transactionTransfers = useSelector(
        (state: TransactionsRootState & TokenDefinitionsRootState) =>
            selectTransactionInputAndOutputTransfers(state, accountKey, txid),
    );

    if (G.isNull(transactionTransfers)) return null;
    const { externalTransfers, internalTransfers, tokenTransfers } = transactionTransfers;
    const { inputsCount, outputsCount } = getTransactionInputsAndOutputsCount(externalTransfers);

    return (
        <TransactionDetailSheet
            title={translate('transactions.detail.sheet.inputs')}
            iconName="swap"
            transactionId={txid}
            sheetName="inputs"
            sheetControls={sheetControls}
        >
            <VStack>
                <TransactionDetailInputsSheetSection
                    header={
                        <InputsOutputsHeader
                            inputsCount={inputsCount}
                            outputsCount={outputsCount}
                        />
                    }
                    transfers={externalTransfers}
                />

                <TransactionDetailInputsSheetSection
                    header={
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="transactions.TransactionDetailScreen.inputsSheet.internalTransfers" />
                        </Text>
                    }
                    transfers={internalTransfers}
                />

                <TransactionDetailInputsSheetSection
                    header={
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="transactions.TransactionDetailScreen.inputsSheet.tokenTransfers" />
                        </Text>
                    }
                    transfers={tokenTransfers}
                />
            </VStack>
        </TransactionDetailSheet>
    );
};
