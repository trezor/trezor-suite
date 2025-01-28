import { ExchangeKYCType } from 'invity-api';
import { useTheme } from 'styled-components';

import { Banner, Icon, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';
import {
    KYC_DEX,
    KYC_NO_KYC,
    KYC_NO_REFUND,
    KYC_REQUIRED,
    KYC_YES_REFUND,
} from 'src/constants/wallet/trading/kyc';
import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { TooltipIcon, TooltipText, TooltipWrap } from 'src/views/wallet/trading';

interface TradingUtilsProviderProps {
    exchange?: string;
    providers?: TradingExchangeProvidersInfoProps;
    isForComparator?: boolean;
}
const getKycPolicy = (kycPolicyType: ExchangeKYCType | undefined) => {
    if (kycPolicyType === KYC_REQUIRED) {
        return <Translation id="TR_TRADING_KYC_REQUIRED" />;
    }

    if (kycPolicyType === KYC_NO_REFUND) {
        return <Translation id="TR_TRADING_KYC_NO_REFUND" />;
    }

    if (kycPolicyType === KYC_YES_REFUND) {
        return <Translation id="TR_TRADING_KYC_YES_REFUND" />;
    }

    if (kycPolicyType === KYC_NO_KYC) {
        return <Translation id="TR_TRADING_KYC_NO_KYC" />;
    }

    return <Translation id="TR_TRADING_KYC_DEX" />;
};

export const TradingUtilsKyc = ({
    exchange,
    providers,
    isForComparator,
}: TradingUtilsProviderProps) => {
    const theme = useTheme();
    const provider = providers && exchange ? providers[exchange] : null;
    const kycPolicyType = provider?.kycPolicyType;
    const kycPolicyTranslation = getKycPolicy(kycPolicyType);

    if (!kycPolicyType || !kycPolicyTranslation) return null;

    if (isForComparator) {
        const kycTitle = [KYC_NO_KYC, KYC_DEX].includes(kycPolicyType)
            ? 'TR_TRADING_KYC_POLICY_NEVER_REQUIRED'
            : 'TR_TRADING_KYC_POLICY';

        return (
            <Tooltip content={kycPolicyTranslation} placement="bottom">
                <TooltipWrap>
                    <TooltipIcon>
                        <Icon name="info" size="small" color={theme.textAlertYellow} />
                    </TooltipIcon>
                    <TooltipText $isYellow>
                        <Translation id={kycTitle} />
                    </TooltipText>
                </TooltipWrap>
            </Tooltip>
        );
    }

    return <Banner icon>{kycPolicyTranslation}</Banner>;
};
