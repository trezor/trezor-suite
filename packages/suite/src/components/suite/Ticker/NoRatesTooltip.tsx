import styled, { useTheme } from 'styled-components';

import { typography } from '@trezor/theme';

import { Translation, TooltipSymbol } from 'src/components/suite';

import { TranslationKey } from '../Translation';


const NoRatesMessage = styled.div`
    ${typography.label};
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.textSubdued};
    text-transform: none;
`;

interface NoRatesTooltipProps {
    customText?: TranslationKey;
    customTooltip?: TranslationKey;
    className?: string;
}

export const NoRatesTooltip = ({ customText, customTooltip, className }: NoRatesTooltipProps) => {
    const theme = useTheme();

    return (
        <NoRatesMessage className={className}>
            <Translation id={customText || 'TR_FIAT_RATES_NOT_AVAILABLE'} />
            <TooltipSymbol
                content={
                    <Translation id={customTooltip || 'TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP'} />
                }
                iconColor={theme.iconSubdued}
            />
        </NoRatesMessage>
    );
};
