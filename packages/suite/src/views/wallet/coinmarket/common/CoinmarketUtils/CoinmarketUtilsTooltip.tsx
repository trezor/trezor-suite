import { Icon, Tooltip } from '@trezor/components';
import { CoinmarketOffersItemProps } from '../CoinmarketOffers/CoinmarketOffersItem';
import styled, { useTheme } from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import CoinmarketUtilsTooltipFee from './CoinmarketUtilsTooltipFee';

const TooltipWrap = styled.div`
    display: flex;
    align-items: center;
    margin-top: ${spacingsPx.xxxs};
`;

const TooltipIcon = styled(Icon)`
    margin-top: 1px;
    margin-right: ${spacingsPx.xs};
`;

const TooltipText = styled.div<{ $isYellow?: boolean }>`
    position: relative;
    ${typography.hint}
    color: ${({ $isYellow, theme }) => ($isYellow ? theme.textAlertYellow : theme.textSubdued)};

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background: ${({ $isYellow, theme }) =>
            $isYellow ? theme.textAlertYellow : theme.textSubdued};
    }
`;

// IN TESTING MODE
const CoinmarketUtilsTooltip = ({ quote }: Pick<CoinmarketOffersItemProps, 'quote'>) => {
    const theme = useTheme();
    const isFeesIncluded = false;
    const notIncludedContent =
        "Certain fees are not included in the displayed price. You will review the final price on the provider's website.";

    if (isFeesIncluded) {
        return (
            <Tooltip content={<CoinmarketUtilsTooltipFee quote={quote} />} placement="bottom">
                <TooltipWrap>
                    <TooltipIcon icon="INFO" size={16} color={theme.textSubdued} />
                    <TooltipText>Fees included</TooltipText>
                </TooltipWrap>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={notIncludedContent} placement="bottom">
            <TooltipWrap>
                <TooltipIcon icon="INFO" size={16} color={theme.textAlertYellow} />
                <TooltipText $isYellow>Fees not included</TooltipText>
            </TooltipWrap>
        </Tooltip>
    );
};

export default CoinmarketUtilsTooltip;
