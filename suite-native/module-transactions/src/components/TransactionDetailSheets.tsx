import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { Card, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionDetailInputsSheet } from './TransactionDetailInputsSheet';
import { TransactionDetailParametersSheet } from './TransactionDetailParametersSheet';
import { TransactionDetailValuesSheet } from './TransactionDetailValuesSheet';

type TransactionDetailSheetsProps = {
    transaction: WalletAccountTransaction;
    isTokenTransaction?: boolean;
    accountKey: AccountKey;
};

const cardStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    paddingRight: utils.spacings.sp12,
}));

export const TransactionDetailSheets = ({
    transaction,
    isTokenTransaction = false,
    accountKey,
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
                <TransactionDetailInputsSheet txid={transaction.txid} accountKey={accountKey} />
            </VStack>
        </Card>
    );
};
