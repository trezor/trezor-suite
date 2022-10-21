import React from 'react';
import styled from 'styled-components';
import { variables, Tooltip, Link } from '@trezor/components';
import { Translation } from '@suite-components';

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

const StyledLink = styled(Link)`
    background: none !important;
    border: none;
    padding: 0 !important;
    cursor: pointer;
    color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: inline;
    align-items: center;
    text-decoration: underline;

    :hover {
        opacity: 0.8;
    }
`;

const AllFeesIncluded = () => (
    <StyledTooltip
        content={
            <Translation
                id="TR_SAVINGS_FEES_TOOLTIP"
                values={{
                    feesOverviewLink: (
                        <StyledLink href="https://blog.invity.io/schedule-of-fees">
                            <Translation id="TR_SAVINGS_FEES_TOOLTIP_FEES_LINK" />
                        </StyledLink>
                    ),
                }}
            />
        }
        dashed
    >
        <Translation id="TR_SAVINGS_SETUP_ALL_FEES_INCLUDED" values={{}} />
    </StyledTooltip>
);

export default AllFeesIncluded;
