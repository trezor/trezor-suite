import { type ExchangeKYCType } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Banner, Icon, Row, Text, Tooltip } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import {
    KYC_DEX,
    KYC_NO_KYC,
    KYC_NO_REFUND,
    KYC_REQUIRED,
    KYC_YES_REFUND,
} from 'src/constants/wallet/trading/kyc';

const TooltipText = styled.span`
    text-decoration: underline dotted;
`;

interface TradingUtilsKycProps {
    kycType?: ExchangeKYCType;
    isForComparator?: boolean;
}

const getKycPolicyTranslation = (kycType: ExchangeKYCType) => {
    switch (kycType) {
        case KYC_REQUIRED:
            return <Translation id="TR_TRADING_KYC_REQUIRED" />;
        case KYC_NO_REFUND:
            return <Translation id="TR_TRADING_KYC_NO_REFUND" />;
        case KYC_YES_REFUND:
            return <Translation id="TR_TRADING_KYC_YES_REFUND" />;
        case KYC_NO_KYC:
            return <Translation id="TR_TRADING_KYC_NO_KYC" />;
        case KYC_DEX:
            return null;
        default:
            return exhaustive(kycType);
    }
};

export const TradingUtilsKyc = ({ kycType, isForComparator }: TradingUtilsKycProps) => {
    if (!kycType) {
        return null;
    }

    if (isForComparator) {
        if (kycType === KYC_DEX) {
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

        const kycPolicyTranslation = getKycPolicyTranslation(kycType);

        if (!kycPolicyTranslation) {
            return null;
        }

        const kycTitle =
            kycType === KYC_NO_KYC
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

    const kycPolicyTranslation = getKycPolicyTranslation(kycType);

    if (!kycPolicyTranslation) {
        return null;
    }

    return <Banner intent="neutral" icon="identificationCard" description={kycPolicyTranslation} />;
};
