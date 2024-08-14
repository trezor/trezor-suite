import { Icon, Row, Text, Tooltip } from '@trezor/components';
import { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import {
    CoinmarketWarning,
    TooltipIcon,
    TooltipText,
    TooltipWrap,
} from 'src/views/wallet/coinmarket';
import { CoinmarketExchangeProvidersInfoProps } from 'src/types/coinmarket/coinmarket';
import { ExchangeKYCType } from 'invity-api';
import {
    KYC_DEX,
    KYC_NO_KYC,
    KYC_NO_REFUND,
    KYC_YES_REFUND,
} from 'src/constants/wallet/coinmarket/kyc';
import { spacings } from '@trezor/theme';

interface CoinmarketUtilsProviderProps {
    exchange?: string;
    providers?: CoinmarketExchangeProvidersInfoProps;
    isForComparator?: boolean;
}
const getKycPolicy = (kycPolicyType: ExchangeKYCType | undefined) => {
    if (kycPolicyType === KYC_NO_REFUND) {
        return <Translation id="TR_COINMARKET_KYC_NO_REFUND" />;
    }

    if (kycPolicyType === KYC_YES_REFUND) {
        return <Translation id="TR_COINMARKET_KYC_YES_REFUND" />;
    }

    if (kycPolicyType === KYC_NO_KYC) {
        return <Translation id="TR_COINMARKET_KYC_NO_KYC" />;
    }

    return <Translation id="TR_COINMARKET_KYC_DEX" />;
};

export const CoinmarketUtilsKyc = ({
    exchange,
    providers,
    isForComparator,
}: CoinmarketUtilsProviderProps) => {
    const theme = useTheme();
    const provider = providers && exchange ? providers[exchange] : null;
    const kycPolicyType = provider?.kycPolicyType;
    const kycPolicyTranslation = getKycPolicy(kycPolicyType);

    if (!kycPolicyType || !kycPolicyTranslation) return null;

    if (isForComparator) {
        const kycTitle = [KYC_NO_KYC, KYC_DEX].includes(kycPolicyType)
            ? 'TR_COINMARKET_KYC_POLICY_NEVER_REQUIRED'
            : 'TR_COINMARKET_KYC_POLICY';

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

    return (
        <CoinmarketWarning>
            <Row alignItems="flex-start" gap={spacings.sm}>
                <Icon name="info" size="large" color={theme.textAlertYellow} />
                <Text>{kycPolicyTranslation}</Text>
            </Row>
        </CoinmarketWarning>
    );
};
