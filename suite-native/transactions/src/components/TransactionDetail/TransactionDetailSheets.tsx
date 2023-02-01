import React, { useState } from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types/src';
import { Card, VStack } from '@suite-native/atoms';

import { TransactionDetailParametersSheet } from './TransactionDetailParametersSheet';
import { TransactionDetailValuesSheet } from './TransactionDetailValuesSheet';
import { TransactionDetailInputsSheet } from './TransactionDetailInputsSheet';

type SheetType = 'parameters' | 'values' | 'inputs';

type TransactionDetailSheetsProps = {
    transaction: WalletAccountTransaction;
};

export const TransactionDetailSheets = ({ transaction }: TransactionDetailSheetsProps) => {
    const [expandedSheet, setExpandedSheet] = useState<SheetType | null>(null);

    const toggleSheet = (sheetName: SheetType) => {
        setExpandedSheet(expandedSheet === sheetName ? null : sheetName);
    };
    return (
        <Card>
            <VStack spacing="small">
                <TransactionDetailParametersSheet
                    isVisible={expandedSheet === 'parameters'}
                    transaction={transaction}
                    onSheetVisibilityChange={() => toggleSheet('parameters')}
                />
                <TransactionDetailValuesSheet
                    isVisible={expandedSheet === 'values'}
                    transaction={transaction}
                    onSheetVisibilityChange={() => toggleSheet('values')}
                />
                <TransactionDetailInputsSheet
                    isVisible={expandedSheet === 'inputs'}
                    transaction={transaction}
                    onSheetVisibilityChange={() => toggleSheet('inputs')}
                />
            </VStack>
        </Card>
    );
};
