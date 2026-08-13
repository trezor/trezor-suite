import { type ReactNode, memo } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    hasEip712SignData,
    selectTradingProviderKycPolicy,
} from '@suite-common/trading';
import { AnimatedVStack, BannerInline, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { KycPolicyWarning, hasKycPolicyWarning } from '@suite-native/trading-provider-utils';
import { SlippagePicker } from '@suite-native/trading-slippage';

import { ExchangeEIP712Info } from './ExchangeEIP712Info';
import { ExchangeFromAccountTradePreviewCard } from './ExchangeFromAccountTradePreviewCard';
import { ExchangeInfo } from './ExchangeInfo';
import { ExchangePreviewIssueBanner } from './ExchangePreviewIssueBanner';
import { ExchangeToAccountTradePreviewCard } from './ExchangeToAccountTradePreviewCard';
import { LastErrorMessage } from '../../general/Error/LastErrorMessage';

export type ExchangePreviewViewProps = {
    quote: ExchangeTrade | undefined;
    txnErrorString: ReactNode | null;
    onSignTransactionNavigation: () => void;
    onSlippageConfirmed: () => Promise<void>;
    isApproved?: boolean;
};

export const ExchangePreviewView = memo(
    ({
        quote,
        txnErrorString,
        onSignTransactionNavigation,
        onSlippageConfirmed,
        isApproved,
    }: ExchangePreviewViewProps) => {
        const { translate } = useTranslate();

        const kycPolicy = useSelector((state: TradingRootState) =>
            selectTradingProviderKycPolicy(state, quote?.exchange, 'exchange'),
        );

        const isTxnError = !!txnErrorString;
        const hasEIP712SignData = hasEip712SignData(quote);

        return (
            <VStack spacing="sp16">
                <LastErrorMessage tradingType="exchange" />
                {!!isApproved && (
                    <BannerInline
                        intent="brand"
                        title={
                            <Translation id="moduleTrading.tradingExchangePreviewScreen.approvalSuccessAlert" />
                        }
                    />
                )}
                {isTxnError && (
                    <Animated.View layout={LinearTransition} entering={FadeIn} exiting={FadeOut}>
                        <BannerInline intent="critical" title={txnErrorString} />
                    </Animated.View>
                )}
                <AnimatedVStack layout={LinearTransition} spacing="sp16">
                    <ExchangeFromAccountTradePreviewCard quote={quote} />
                    <ExchangeToAccountTradePreviewCard quote={quote} />
                    {hasEIP712SignData ? (
                        <ExchangeEIP712Info exchange={quote?.exchange}>
                            <SlippagePicker onSlippageConfirmed={onSlippageConfirmed} />
                        </ExchangeEIP712Info>
                    ) : (
                        <ExchangeInfo quote={quote} isTxnError={isTxnError}>
                            <SlippagePicker onSlippageConfirmed={onSlippageConfirmed} />
                        </ExchangeInfo>
                    )}

                    {!isTxnError && (
                        <ExchangePreviewIssueBanner
                            onSignTransactionNavigation={onSignTransactionNavigation}
                        />
                    )}

                    {hasKycPolicyWarning(kycPolicy) && (
                        <BannerInline
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
