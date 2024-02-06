import styled from 'styled-components';
import { Link, Tooltip } from '@trezor/components';
import { INVITY_SCHEDULE_OF_FEES } from '@trezor/urls';
import { Translation } from 'src/components/suite';
import { typography } from '@trezor/theme';

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued}
`;

const StyledLink = styled(Link)`
    text-decoration: underline;
    ${typography.hint}
    color: ${({ theme }) => theme.textDefaultInverted};
`;

export const AllFeesIncluded = () => (
    <StyledTooltip
        content={
            <Translation
                id="TR_SAVINGS_FEES_TOOLTIP"
                values={{
                    feesOverviewLink: (
                        <StyledLink href={INVITY_SCHEDULE_OF_FEES}>
                            <Translation id="TR_SAVINGS_FEES_TOOLTIP_FEES_LINK" />
                        </StyledLink>
                    ),
                }}
            />
        }
        dashed
    >
        <Translation id="TR_SAVINGS_SETUP_ALL_FEES_INCLUDED" />
    </StyledTooltip>
);
