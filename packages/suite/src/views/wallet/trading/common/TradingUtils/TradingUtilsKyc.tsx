import { type ExchangeKYCType } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Banner, Icon, Row, Text, Tooltip } from '@trezor/components';

import {
    KYC_DEX,
    KYC_NO_KYC,
    KYC_NO_REFUND,
    KYC_REQUIRED,
    KYC_YES_REFUND,
} from 'src/constants/wallet/trading/kyc';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';

const TooltipText = styled.span`
    text-decoration: underline dotted;
`;

interface TradingUtilsProviderProps {
    exchange?: string;
    providers?: TradingExchangeProvidersInfoProps;
    isForComparator?: boolean;
    isDex?: boolean;
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
};

export const TradingUtilsKyc = ({
    exchange,
    providers,
    isForComparator,
    isDex,
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;
    const kycPolicyType = provider?.kycPolicyType;
    const kycPolicyTranslation = getKycPolicy(kycPolicyType);

    if (isForComparator) {
        if (isDex) {
            return (
                <Row alignItems="center" gap={4}>
                    <Icon
                        name="detective"
                        color="contentBrand"
                        size={12}
                        data-testid="@trading/kyc/dex"
                    />
                    <Text typographyStyle="body-sm" color="contentBrand">
                        <Translation id="TR_TRADING_KYC_ANONYMOUS" />
                    </Text>
                </Row>
            );
        }

        if (!kycPolicyType || !kycPolicyTranslation) {
            return null;
        }

        const kycTitle = [KYC_NO_KYC, KYC_DEX].includes(kycPolicyType)
            ? 'TR_TRADING_KYC_POLICY_NEVER_REQUIRED'
            : 'TR_TRADING_KYC_POLICY';

        return (
            <Tooltip content={kycPolicyTranslation} placement="bottom">
                <TooltipText>
                    <Text color="contentWarning" typographyStyle="body-sm">
                        <Row gap={4}>
                            <Icon name="identificationCard" color="contentWarning" size={12} />
                            <Translation id={kycTitle} />
                        </Row>
                    </Text>
                </TooltipText>
            </Tooltip>
        );
    }

    if (!kycPolicyType || !kycPolicyTranslation) {
        return null;
    }

    return <Banner icon description={kycPolicyTranslation} />;
};
