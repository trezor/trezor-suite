import { memo } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import type { ExchangeTrade } from 'invity-api';

import { InlineAlertBox, VStack } from '@suite-native/atoms';

import { ExchangeFeePickerCard } from './ExchangeFeePickerCard';
import { ExchangeFromAccountTradePreviewCard } from './ExchangeFromAccountTradePreviewCard';
import { ExchangeToAccountTradePreviewCard } from './ExchangeToAccountTradePreviewCard';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type ExchangePreviewViewProps = {
    quote: ExchangeTrade | undefined;
    txnErrorString: string | null;
};

export const ExchangePreviewView = memo(({ quote, txnErrorString }: ExchangePreviewViewProps) => {
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);
    const isTxnError = !!txnErrorString;

    return (
        <ScrollView>
            <VStack spacing="sp20" paddingVertical="sp20">
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
        </ScrollView>
    );
});
