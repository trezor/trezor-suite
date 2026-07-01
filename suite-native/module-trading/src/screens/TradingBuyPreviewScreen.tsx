import { useSelector } from 'react-redux';

import {
    selectTradingBuySelectedQuote,
    selectTradingProviderMetadata,
} from '@suite-common/trading';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { Footer } from '@suite-native/trading-provider-utils';

import { BuyGeneralErrorScreen } from '../components/buy/BuyPreview/BuyGeneralErrorScreen';
import { BuyPreviewContinueButton } from '../components/buy/BuyPreview/BuyPreviewContinueButton';
import { BuyPreviewInfoCard } from '../components/buy/BuyPreview/BuyPreviewInfoCard';
import { BuyPreviewReceiveCard } from '../components/buy/BuyPreview/BuyPreviewReceiveCard';
import { BuySellKYCWarning } from '../components/general/BuySellKYCWarning';
import { LastErrorMessage } from '../components/general/Error/LastErrorMessage';

export const TradingBuyPreviewScreen = () => {
    const providerMetadata = useSelector(selectTradingProviderMetadata);
    const quote = useSelector(selectTradingBuySelectedQuote);

    if (!quote || !providerMetadata) {
        return <BuyGeneralErrorScreen />;
    }

    const { companyName } = providerMetadata;

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleTrading.tradingBuyPreviewScreen.title"
                            values={{ companyName }}
                        />
                    }
                    subtitle={<Translation id="moduleTrading.tradingBuyPreviewScreen.subtitle" />}
                    closeActionType="back"
                />
            }
            footer={<BuyPreviewContinueButton companyName={companyName} />}
        >
            <VStack spacing="sp16" flex={1}>
                <LastErrorMessage tradingType="buy" />
                <BuyPreviewReceiveCard quote={quote} />
                <BuyPreviewInfoCard quote={quote} />
                <BuySellKYCWarning type="buy" />
                <Footer />
            </VStack>
        </Screen>
    );
};
