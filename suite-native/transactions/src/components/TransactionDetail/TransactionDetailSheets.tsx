import { useState } from 'react';

import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Card, VStack } from '@suite-native/atoms';
import { isTestnet } from '@suite-common/wallet-utils';
import { analytics, EventType } from '@suite-native/analytics';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
    accountKey: AccountKey;
};

const sheetToAnalyticsEventMap: Record<SheetType, TransactionSheetAnalyticsEventType> = {
    parameters: EventType.TransactionDetailParameters,
    values: EventType.TransactionDetailCompareValues,
    inputs: EventType.TransactionDetailInputOutput,
};

const cardStyle = prepareNativeStyle(() => ({ paddingVertical: 12, paddingRight: 12 }));

export const TransactionDetailSheets = ({
    transaction,
    isTokenTransaction = false,
    accountKey,
}: TransactionDetailSheetsProps) => {
    const { applyStyle } = useNativeStyles();
    const [expandedSheet, setExpandedSheet] = useState<SheetType | null>(null);

    const toggleSheet = (sheetName: SheetType) => {
        if (sheetName !== expandedSheet)
            analytics.report({ type: sheetToAnalyticsEventMap[sheetName] });

        setExpandedSheet(expandedSheet === sheetName ? null : sheetName);
    };

    const isValuesSheetVisible = !isTestnet(transaction.symbol) && !isTokenTransaction;

    return (
        <Card style={applyStyle(cardStyle)} borderColor="borderElevation1">
            <VStack spacing="sp24">
                <TransactionDetailParametersSheet
                    isVisible={expandedSheet === 'parameters'}
                    transaction={transaction}
                    onSheetVisibilityChange={() => toggleSheet('parameters')}
                    accountKey={accountKey}
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
                    txid={transaction.txid}
                    accountKey={accountKey}
                    onSheetVisibilityChange={() => toggleSheet('inputs')}
                />
            </VStack>
        </Card>
    );
};
