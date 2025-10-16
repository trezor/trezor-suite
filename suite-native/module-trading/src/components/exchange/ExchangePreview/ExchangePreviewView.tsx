import { memo } from 'react';
import Animated from 'react-native-reanimated';

import type { ExchangeTrade } from 'invity-api';

import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeFeePickerCard } from './ExchangeFeePickerCard';
import { ExchangeFromAccountTradePreviewCard } from './ExchangeFromAccountTradePreviewCard';
import { ExchangeToAccountTradePreviewCard } from './ExchangeToAccountTradePreviewCard';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type ExchangePreviewViewProps = {
    quote: ExchangeTrade | undefined;
    txnErrorString: string | null;
    isApproved?: boolean;
};

export const ExchangePreviewView = memo(
    ({ quote, txnErrorString, isApproved }: ExchangePreviewViewProps) => {
        const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);
        const isTxnError = !!txnErrorString;

        return (
            <VStack spacing="sp20" paddingVertical="sp20">
                {!!isApproved && (
                    <InlineAlertBox
                        variant="success"
                        title={
                            <Translation id="moduleTrading.tradingExchangePreviewScreen.approvalSuccessAlert" />
                        }
                    />
                )}
                {isTxnError && (
                    <Animated.View>
                        <InlineAlertBox variant="critical" title={txnErrorString} />
                    </Animated.View>
                )}
                <ExchangeFromAccountTradePreviewCard
                    quote={quote}
                    fromStringValue={fromStringValue}
                />
                <ExchangeToAccountTradePreviewCard quote={quote} toStringValue={toStringValue} />
                <ExchangeFeePickerCard quote={quote} isTxnError={isTxnError} />
            </VStack>
        );
    },
);
