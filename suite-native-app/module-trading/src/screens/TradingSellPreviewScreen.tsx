import { useEffect, useEffectEvent } from 'react';
import { useSelector } from 'react-redux';

import {
    selectTradingProviderMetadata,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import { KYCWarning } from '@suite-native/trading-atoms';
import { Footer } from '@suite-native/trading-provider-utils';

import { LastErrorMessage } from '../components/general/Error/LastErrorMessage';
import { TradingPreviewErrorScreen } from '../components/general/TradingPreview/TradingPreviewErrorScreen';
import { SellPreviewContinueButton } from '../components/sell/SellPreview/SellPreviewContinueButton';
import { SellPreviewView } from '../components/sell/SellPreview/SellPreviewView';

export const TradingSellPreviewScreen = () => {
    const providerMetadata = useSelector(selectTradingProviderMetadata);
    const quote = useSelector(selectTradingSellSelectedQuote);

    const reportToAnalytics = useSellAnalyticReportCallback();
    const reportVisit = useEffectEvent(() => {
        reportToAnalytics('transaction-preview', 'visit');
    });
    useEffect(() => {
        reportVisit();
    }, []);

    if (!quote || !providerMetadata) {
        return <TradingPreviewErrorScreen screenName="TradingSellPreviewScreen" />;
    }

    const { companyName } = providerMetadata;

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleTrading.tradingSellPreviewScreen.headerTitle"
                            values={{ companyName }}
                        />
                    }
                    subtitleVariant="body-sm"
                    subtitle={
                        <Translation
                            id="moduleTrading.tradingSellPreviewScreen.subtitle"
                            values={{ companyName }}
                        />
                    }
                    closeActionType="back"
                />
            }
            footer={<SellPreviewContinueButton companyName={companyName} />}
        >
            <VStack spacing="sp16" flex={1}>
                <LastErrorMessage tradingType="sell" />
                <SellPreviewView quote={quote} />
                <KYCWarning />
                <Footer />
            </VStack>
        </Screen>
    );
};
