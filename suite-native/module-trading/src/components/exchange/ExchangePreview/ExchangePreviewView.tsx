import { type ReactNode, memo } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { type TradingRootState, selectTradingProviderKycPolicy } from '@suite-common/trading';
import { AnimatedVStack, InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { ExchangeFeePickerCard } from './ExchangeFeePickerCard';
import { ExchangeFiatDeviationWarning } from './ExchangeFiatDeviationWarning';
import { ExchangeFromAccountTradePreviewCard } from './ExchangeFromAccountTradePreviewCard';
import { ExchangeFusionPlusInfo } from './ExchangeFusionPlusInfo';
import { ExchangeToAccountTradePreviewCard } from './ExchangeToAccountTradePreviewCard';
import { getKycPolicyWarningTranslation } from '../../../utils/general/kycUtils';
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
        const isFusionPlus = quote?.exchange === '1inchfusionplus';

        const kycWarning = getKycPolicyWarningTranslation(kycPolicy);

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
                    <ExchangeFeePickerCard quote={quote} isTxnError={isTxnError} />
                    {isFusionPlus && <ExchangeFusionPlusInfo />}
                    {kycWarning && (
                        <InlineAlertBox
                            variant="warning"
                            title={kycWarning}
                            accessibilityHint={translate('generic.warning')}
                        />
                    )}
                </AnimatedVStack>
            </VStack>
        );
    },
);
