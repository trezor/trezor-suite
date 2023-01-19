import React, { useState } from 'react';

import { FiatCurrency } from 'suite-common/suite-config/src';

import { WalletAccountTransaction } from '@suite-common/wallet-types/src';
import { Card, VStack } from '@suite-native/atoms';

import { TransactionDetailParametersSheet } from './TransactionDetailParametersSheet';
import { TransactionDetailValuesSheet } from './TransactionDetailValuesSheet';
import { TransactionDetailInputsSheet } from './TransactionDetailInputsSheet';

type SheetType = 'parameters' | 'values' | 'inputs';

type TransactionDetailSheetsProps = {
    transaction: WalletAccountTransaction;
    fiatCurrency: FiatCurrency;
};

export const TransactionDetailSheets = ({
    transaction,
    fiatCurrency,
}: TransactionDetailSheetsProps) => {
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
                    fiatCurrency={fiatCurrency}
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
