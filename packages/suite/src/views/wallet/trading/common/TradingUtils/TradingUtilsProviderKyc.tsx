import { type ExchangeKYCType } from 'invity-api';

import { TradingUtilsKyc } from './TradingUtilsKyc';
import { KYC_DEX, KYC_REQUIRED } from '../../../../../constants/wallet/trading/kyc';
import { type TradingExchangeProvidersInfoProps } from '../../../../../types/trading/trading';

interface TradingUtilsProviderKycProps {
    exchange?: string;
    providers?: TradingExchangeProvidersInfoProps;
    isForComparator?: boolean;
    isDex?: boolean;
    isBuySell?: boolean;
}

const getKycType = ({
    exchange,
    providers,
    isDex,
    isBuySell,
}: Pick<TradingUtilsProviderKycProps, 'exchange' | 'providers' | 'isDex' | 'isBuySell'>):
    ExchangeKYCType | undefined => {
    // Buy and sell providers always require KYC and do not expose a kyc policy.
    if (isBuySell) {
        return KYC_REQUIRED;
    }

    if (isDex) {
        return KYC_DEX;
    }

    return providers && exchange ? providers[exchange]?.kycPolicyType : undefined;
};

export const TradingUtilsProviderKyc = ({
    exchange,
    providers,
    isForComparator,
    isDex,
    isBuySell,
}: TradingUtilsProviderKycProps) => (
    <TradingUtilsKyc
        kycType={getKycType({ exchange, providers, isDex, isBuySell })}
        isForComparator={isForComparator}
    />
);
