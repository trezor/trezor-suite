import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { Card, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TransactionDetailInputsSheet } from './TransactionDetailInputsSheet';
import { TransactionDetailParametersSheet } from './TransactionDetailParametersSheet';
import { type SheetControls } from './TransactionDetailSheet';
import { TransactionDetailValuesSheet } from './TransactionDetailValuesSheet';

type TransactionDetailSheetsProps = {
    transaction: WalletAccountTransaction;
    isTokenTransaction?: boolean;
    accountKey: AccountKey;
    inputsSheetControls?: SheetControls;
};

const cardStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    paddingRight: utils.spacings.sp12,
}));

export const TransactionDetailSheets = ({
    transaction,
    isTokenTransaction = false,
    accountKey,
    inputsSheetControls,
}: TransactionDetailSheetsProps) => {
    const { applyStyle } = useNativeStyles();

    const isValuesSheetVisible = !isTestnet(transaction.symbol) && !isTokenTransaction;

    return (
        <Card style={applyStyle(cardStyle)} borderColor="borderElevation1">
            <VStack spacing="sp24">
                <TransactionDetailParametersSheet
                    transaction={transaction}
                    accountKey={accountKey}
                />

                {isValuesSheetVisible && <TransactionDetailValuesSheet transaction={transaction} />}
                <TransactionDetailInputsSheet
                    txid={transaction.txid}
                    accountKey={accountKey}
                    sheetControls={inputsSheetControls}
                />
            </VStack>
        </Card>
    );
};
