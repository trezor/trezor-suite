import { ReactNode, memo } from 'react';
import Animated from 'react-native-reanimated';

import type { ExchangeTrade } from 'invity-api';

import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeFeePickerCard } from './ExchangeFeePickerCard';
import { ExchangeFromAccountTradePreviewCard } from './ExchangeFromAccountTradePreviewCard';
import { ExchangeFusionPlusInfo } from './ExchangeFusionPlusInfo';
import { ExchangeToAccountTradePreviewCard } from './ExchangeToAccountTradePreviewCard';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { LastErrorMessage } from '../../general/Error/LastErrorMessage';

export type ExchangePreviewViewProps = {
    quote: ExchangeTrade | undefined;
    txnErrorString: ReactNode | null;
    isApproved?: boolean;
};

export const ExchangePreviewView = memo(
    ({ quote, txnErrorString, isApproved }: ExchangePreviewViewProps) => {
        const { fromStringValue, toStringValue, fromValue, toValue } =
            useChangeStringsExtractor(quote);
        const isTxnError = !!txnErrorString;
        const isFusionPlus = quote?.exchange === '1inchfusionplus';

        return (
            <VStack spacing="sp20" paddingVertical="sp20">
                <LastErrorMessage tradingType="exchange" />
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
                    fromValue={fromValue}
                />
                <ExchangeToAccountTradePreviewCard
                    quote={quote}
                    toStringValue={toStringValue}
                    toValue={toValue}
                />
                <ExchangeFeePickerCard quote={quote} isTxnError={isTxnError} />
                {isFusionPlus && <ExchangeFusionPlusInfo />}
            </VStack>
        );
    },
);
