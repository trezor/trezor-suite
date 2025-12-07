import styled from 'styled-components';

import { Tooltip } from '@trezor/components';
import { typography } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

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

export const NoRatesTooltip = ({ customText, customTooltip, className }: NoRatesTooltipProps) => (
    <NoRatesMessage className={className}>
        <Tooltip
            content={<Translation id={customTooltip || 'TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP'} />}
            maxWidth={250}
            hasIcon
        >
            <Translation id={customText || 'TR_FIAT_RATES_NOT_AVAILABLE'} />
        </Tooltip>
    </NoRatesMessage>
);
