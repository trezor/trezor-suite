import React, { useState } from 'react';

import { WalletAccountTransaction } from '@suite-common/wallet-types/src';
import { Card, VStack } from '@suite-native/atoms';
import { isTestnet } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@suite-native/analytics';

import { TransactionDetailParametersSheet } from './TransactionDetailParametersSheet';
import { TransactionDetailValuesSheet } from './TransactionDetailValuesSheet';
import { TransactionDetailInputsSheet } from './TransactionDetailInputsSheet';

type SheetType = 'parameters' | 'values' | 'inputs';
type TransactionSheetAnalyticsEventType =
    | EventType.TransactionDetailParameters
    | EventType.TransactionDetailCompareValues
    | EventType.TransactionDetailInputOutput;

type TransactionDetailSheetsProps = {
    transaction: WalletAccountTransaction;
    isTokenTransaction?: boolean;
};

const sheetToAnalyticsEventMap: Record<SheetType, TransactionSheetAnalyticsEventType> = {
    parameters: EventType.TransactionDetailParameters,
    values: EventType.TransactionDetailCompareValues,
    inputs: EventType.TransactionDetailInputOutput,
};

export const TransactionDetailSheets = ({
    transaction,
    isTokenTransaction = false,
}: TransactionDetailSheetsProps) => {
    const [expandedSheet, setExpandedSheet] = useState<SheetType | null>(null);

    const toggleSheet = (sheetName: SheetType) => {
        if (sheetName !== expandedSheet)
            analytics.report({ type: sheetToAnalyticsEventMap[sheetName] });

        setExpandedSheet(expandedSheet === sheetName ? null : sheetName);
    };

    const isValuesSheetVisible = !isTestnet(transaction.symbol) && !isTokenTransaction;

    return (
        <Card>
            <VStack spacing="small">
                <TransactionDetailParametersSheet
                    isVisible={expandedSheet === 'parameters'}
                    transaction={transaction}
                    onSheetVisibilityChange={() => toggleSheet('parameters')}
                />

                {isValuesSheetVisible && (
                    <TransactionDetailValuesSheet
                        isVisible={expandedSheet === 'values'}
                        transaction={transaction}
                        onSheetVisibilityChange={() => toggleSheet('values')}
                    />
                )}
                <TransactionDetailInputsSheet
                    isVisible={expandedSheet === 'inputs'}
                    transaction={transaction}
                    onSheetVisibilityChange={() => toggleSheet('inputs')}
                />
            </VStack>
        </Card>
    );
};
