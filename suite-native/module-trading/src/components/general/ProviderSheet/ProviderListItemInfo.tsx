import { type ReactNode } from 'react';

import {
    type TradingProviderInfo,
    type TradingTradeType,
    isBuyTrade,
    isSellFiatTrade,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import { KycPolicyWarning, hasKycPolicyWarning } from '@suite-native/trading-provider-utils';

import { RequestedAmountShortfallNote } from '../RequestedAmountShortfallNote';
import { InfoLineItem } from './InfoLineItem';

export type ProviderListItemInfoProps<T extends TradingTradeType> = {
    quote: T;
    provider: TradingProviderInfo;
    shouldShowExchangeType: boolean;
};

export const ProviderListItemInfo = <T extends TradingTradeType>({
    quote,
    provider,
    shouldShowExchangeType,
}: ProviderListItemInfoProps<T>) => {
    let isDex = false;
    let isAnonymous = false;
    let kycWarning: ReactNode = null;

    if ('kycPolicyType' in provider) {
        const kycPolicy = provider.kycPolicyType;

        isDex = kycPolicy === 'DEX';

        isAnonymous = kycPolicy === 'noKYC' || isDex;
        if (hasKycPolicyWarning(kycPolicy)) {
            kycWarning = <KycPolicyWarning kycPolicyType={kycPolicy} />;
        }
    } else if (isBuyTrade(quote) || isSellFiatTrade(quote)) {
        kycWarning = <Translation id="moduleTrading.providerListItem.kycRequired" />;
    }

    return (
        <>
            <RequestedAmountShortfallNote quote={quote} />
            {shouldShowExchangeType && (
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
            )}
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
                    iconName="identificationCard"
                    text={kycWarning}
                    iconColor="contentWarning"
                    textColor="contentWarning"
                />
            )}
        </>
    );
};
