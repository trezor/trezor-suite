import { Icon, Tooltip } from '@trezor/components';
import { CoinmarketOffersItemProps } from '../CoinmarketOffers/CoinmarketOffersItem';
import styled, { useTheme } from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import CoinmarketUtilsTooltipFee from './CoinmarketUtilsTooltipFee';
import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

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
    const { translationString } = useTranslation();
    const isFeesIncluded = false;
    const notIncludedContent = translationString('TR_COINMARKET_FEES_ON_WEBSITE');

    if (isFeesIncluded) {
        return (
            <Tooltip content={<CoinmarketUtilsTooltipFee quote={quote} />} placement="bottom">
                <TooltipWrap>
                    <TooltipIcon icon="INFO" size={16} color={theme.textSubdued} />
                    <TooltipText>
                        <Translation id="TR_COINMARKET_FEES_INCLUDED" />
                    </TooltipText>
                </TooltipWrap>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={notIncludedContent} placement="bottom">
            <TooltipWrap>
                <TooltipIcon icon="INFO" size={16} color={theme.textAlertYellow} />
                <TooltipText $isYellow>
                    <Translation id="TR_COINMARKET_FEES_NOT_INCLUDED" />
                </TooltipText>
            </TooltipWrap>
        </Tooltip>
    );
};

export default CoinmarketUtilsTooltip;
