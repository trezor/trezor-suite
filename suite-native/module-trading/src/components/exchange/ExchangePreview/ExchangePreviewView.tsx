import { type ReactNode, memo } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    hasEip712SignData,
    selectTradingProviderKycPolicy,
} from '@suite-common/trading';
import { AnimatedVStack, InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { KycPolicyWarning, hasKycPolicyWarning } from '@suite-native/trading-provider-utils';

import { ExchangeEIP712Info } from './ExchangeEIP712Info';
import { ExchangeFeePickerCard } from './ExchangeFeePickerCard';
import { ExchangeFiatDeviationWarning } from './ExchangeFiatDeviationWarning';
import { ExchangeFromAccountTradePreviewCard } from './ExchangeFromAccountTradePreviewCard';
import { ExchangeToAccountTradePreviewCard } from './ExchangeToAccountTradePreviewCard';
import { LastErrorMessage } from '../../general/Error/LastErrorMessage';

export type ExchangePreviewViewProps = {
    quote: ExchangeTrade | undefined;
    txnErrorString: ReactNode | null;
    isApproved?: boolean;
};

export const ExchangePreviewView = memo(
    ({ quote, txnErrorString, isApproved }: ExchangePreviewViewProps) => {
        const { translate } = useTranslate();

        const kycPolicy = useSelector((state: TradingRootState) =>
            selectTradingProviderKycPolicy(state, quote?.exchange, 'exchange'),
        );

        const isTxnError = !!txnErrorString;
        const hasEIP712SignData = hasEip712SignData(quote);

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
                    <Animated.View layout={LinearTransition} entering={FadeIn} exiting={FadeOut}>
                        <InlineAlertBox variant="critical" title={txnErrorString} />
                    </Animated.View>
                )}
                <AnimatedVStack layout={LinearTransition}>
                    <ExchangeFromAccountTradePreviewCard quote={quote} />
                    <ExchangeToAccountTradePreviewCard quote={quote} />
                    <ExchangeFiatDeviationWarning quote={quote} />
                    {hasEIP712SignData ? (
                        <ExchangeEIP712Info exchange={quote?.exchange} />
                    ) : (
                        <ExchangeFeePickerCard quote={quote} isTxnError={isTxnError} />
                    )}
                    {hasKycPolicyWarning(kycPolicy) && (
                        <InlineAlertBox
                            iconName="identificationCard"
                            title={<KycPolicyWarning kycPolicyType={kycPolicy} />}
                            accessibilityHint={translate('generic.warning')}
                        />
                    )}
                </AnimatedVStack>
            </VStack>
        );
    },
);
