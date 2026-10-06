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
};

export const ProviderListItemInfo = <T extends TradingTradeType>({
    quote,
    provider,
}: ProviderListItemInfoProps<T>) => {
    let isAnonymous = false;
    let kycWarning: ReactNode = null;

    if ('kycPolicyType' in provider) {
        const kycPolicy = provider.kycPolicyType;

        isAnonymous = kycPolicy === 'noKYC' || kycPolicy === 'DEX';
        if (hasKycPolicyWarning(kycPolicy)) {
            kycWarning = <KycPolicyWarning kycPolicyType={kycPolicy} />;
        }
    } else if (isBuyTrade(quote) || isSellFiatTrade(quote)) {
        kycWarning = <Translation id="moduleTrading.providerListItem.kycRequired" />;
    }

    return (
        <>
            <RequestedAmountShortfallNote quote={quote} />
            {isAnonymous && (
                <InfoLineItem
                    iconName="detective"
                    text={
                        <Translation id="moduleTrading.providerListItem.noIdentityVerification" />
                    }
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
