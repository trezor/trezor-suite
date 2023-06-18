import React from 'react';
import styled from 'styled-components';
import { Link, Tooltip, variables } from '@trezor/components';
import { INVITY_SCHEDULE_OF_FEES } from '@trezor/urls';
import { Translation } from 'src/components/suite';

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledLink = styled(Link)`
    background: none !important;
    border: none;
    padding: 0 !important;
    cursor: pointer;
    color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: inline;
    align-items: center;
    text-decoration: underline;

    :hover {
        opacity: 0.8;
    }
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
