import {
    type TradingProviderInfo,
    type TradingTradeType,
    isBuyTrade,
    isSellFiatTrade,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';

import { InfoLineItem } from './InfoLineItem';
import { getKycPolicyWarningTranslation } from '../../../utils/general/kycUtils';

export type ProviderListItemInfoProps<T extends TradingTradeType> = {
    quote: T;
    provider: TradingProviderInfo;
};

export const ProviderListItemInfo = <T extends TradingTradeType>({
    quote,
    provider,
}: ProviderListItemInfoProps<T>) => {
    let isDex = false;
    let isAnonymous = false;
    let kycWarning;

    if ('kycPolicyType' in provider) {
        const kycPolicy = provider.kycPolicyType;

        isDex = kycPolicy === 'DEX';

        isAnonymous = kycPolicy === 'noKYC' || isDex;
        kycWarning = getKycPolicyWarningTranslation(kycPolicy);
    } else if (isBuyTrade(quote) || isSellFiatTrade(quote)) {
        kycWarning = <Translation id="moduleTrading.providerListItem.kycRequired" />;
    }

    return (
        <>
            <InfoLineItem
                iconName="info"
                text={
                    isDex ? (
                        <Translation id="moduleTrading.providerListItem.decentralizedExchange" />
                    ) : (
                        <Translation id="moduleTrading.providerListItem.centralizedExchange" />
                    )
                }
            />
            {isAnonymous && (
                <InfoLineItem
                    iconName="info"
                    text={<Translation id="moduleTrading.providerListItem.anonymous" />}
                    iconColor="contentBrand"
                    textColor="contentBrand"
                />
            )}
            {kycWarning && (
                <InfoLineItem
                    iconName="warning"
                    text={kycWarning}
                    iconColor="contentCritical"
                    textColor="contentCritical"
                />
            )}
        </>
    );
};
