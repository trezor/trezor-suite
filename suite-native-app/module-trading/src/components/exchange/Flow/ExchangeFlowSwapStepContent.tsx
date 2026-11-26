import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    hasEip712SignData,
    selectTradingProviderKycPolicy,
} from '@suite-common/trading';
import { BannerInline, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';
import { TradingHistoryDetailAssetRow } from '@suite-native/trading-history';
import { KycPolicyWarning, hasKycPolicyWarning } from '@suite-native/trading-provider-utils';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { useExchangeSwapAssets } from '../../../hooks/exchange/useExchangeSwapAssets';
import { LastErrorMessage } from '../../general/Error/LastErrorMessage';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';
import { TradeFeeInfoRow } from '../../general/TradeInfo/TradeFeeInfoRow';
import { ExchangePreviewIssueBanner } from '../ExchangePreview/ExchangePreviewIssueBanner';
import { ExchangePreviewSimulationInfo } from '../ExchangePreview/ExchangePreviewSimulationInfo';
import { ExchangeSlippagePicker } from '../ExchangePreview/ExchangeSlippagePicker';

export type ExchangeFlowSwapStepContentProps = {
    quote: ExchangeTrade | undefined;
    txnErrorString: ReactNode | null;
    onSignTransactionNavigation: () => void;
    onSlippageConfirmed: () => Promise<void>;
};

export const ExchangeFlowSwapStepContent = ({
    quote,
    txnErrorString,
    onSignTransactionNavigation,
    onSlippageConfirmed,
}: ExchangeFlowSwapStepContentProps) => {
    const { translate } = useTranslate();
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const kycPolicy = useSelector((state: TradingRootState) =>
        selectTradingProviderKycPolicy(state, quote?.exchange, 'exchange'),
    );
    const { payAsset, getAsset } = useExchangeSwapAssets(quote);

    const isTxnError = !!txnErrorString;
    // A signed EIP-712 order or an errored quote has no transaction to pay a fee for.
    const isFeeVisible = !hasEip712SignData(quote) && !quote?.error;
    // The fee row shows the transaction error itself.
    const isErrorBannerVisible = isTxnError && !isFeeVisible;

    return (
        <>
            <CurrentStepCardHeader>
                <Text variant="headline-sm">
                    <Translation id="moduleTrading.tradingExchangeFlowScreen.swapStep.title" />
                </Text>
                <ExchangePreviewSimulationInfo />
            </CurrentStepCardHeader>
            {!!payAsset && <TradingHistoryDetailAssetRow asset={payAsset} side="pay" />}
            {!!getAsset && <TradingHistoryDetailAssetRow asset={getAsset} side="get" />}
            <ProviderInfoRow exchange={quote?.exchange} tradingType="exchange" />
            {isFeeVisible && !!sendAccount && (
                <TradeFeeInfoRow
                    trade={quote}
                    accountKey={sendAccount.key}
                    tradingType="exchange"
                    baseValueOnly
                />
            )}
            <ExchangeSlippagePicker quote={quote} onSlippageConfirmed={onSlippageConfirmed} />
            <VStack spacing="sp16" paddingHorizontal="sp16" paddingBottom="sp16">
                <LastErrorMessage tradingType="exchange" />
                {isErrorBannerVisible && <BannerInline intent="critical" title={txnErrorString} />}
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
            </VStack>
        </>
    );
};
