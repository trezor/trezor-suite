import { memo } from 'react';
import Animated from 'react-native-reanimated';

import type { SellFiatTrade } from 'invity-api';

import { InlineAlertBox, VStack } from '@suite-native/atoms';

import { SellFromAccountTradePreviewCard } from './SellFromAccountTradePreviewCard';
import { SellToFiatTradePreviewCard } from './SellToFiatTradePreviewCard';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type SellPreviewViewProps = {
    quote: SellFiatTrade | undefined;
    txnErrorString: string | null;
};

export const SellPreviewView = memo(({ quote, txnErrorString }: SellPreviewViewProps) => {
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);
    const isTxnError = !!txnErrorString;

    return (
        <VStack spacing="sp20" paddingVertical="sp20">
            {isTxnError && (
                <Animated.View>
                    <InlineAlertBox variant="critical" title={txnErrorString} />
                </Animated.View>
            )}
            <SellFromAccountTradePreviewCard quote={quote} fromStringValue={fromStringValue} />
            <SellToFiatTradePreviewCard quote={quote} toStringValue={toStringValue} />
        </VStack>
    );
});
