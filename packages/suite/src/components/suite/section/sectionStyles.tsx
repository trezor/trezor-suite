import { ReactNode } from 'react';

import styled from 'styled-components';

import { Button, ButtonProps, Select, SelectProps, Tooltip, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

const { SCREEN_SIZE } = variables;

export const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    flex-wrap: wrap;

    @media (max-width: ${SCREEN_SIZE.SM}) {
        justify-content: flex-start;
        margin-top: 10px;
    }
`;

type WithTooltipProps = { tooltipContent?: ReactNode; isTooltipActive?: boolean };

export const ActionSelect = styled(
    ({ tooltipContent, isTooltipActive, ...selectProps }: SelectProps & WithTooltipProps) => (
        <Tooltip content={tooltipContent} isActive={isTooltipActive} cursor="inherit">
            <Select
                {...selectProps}
                margin={{ top: spacings.xxs, bottom: spacings.xxs, left: spacings.xxs }}
                size="small"
                width={170}
            />
        </Tooltip>
    ),
)`
    &:not(:first-child) {
        margin-left: 8px;
    }

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

export const ActionButton = styled(
    ({
        tooltipContent,
        isTooltipActive,
        children,
        ...buttonProps
    }: WithTooltipProps & ButtonProps) => (
        <Tooltip content={tooltipContent} isActive={isTooltipActive} cursor="inherit">
            <Button
                {...buttonProps}
                size="small"
                margin={{ top: spacings.xxs, bottom: spacings.xxs, left: spacings.xxs }}
                minWidth={140}
            >
                {children}
            </Button>
        </Tooltip>
    ),
)`
    &:not(:first-child) {
        margin-left: 8px;

        @media (max-width: ${SCREEN_SIZE.SM}) {
            margin-left: 0;
        }
    }

    @media (max-width: ${SCREEN_SIZE.SM}) {
        width: 100%;
        margin: 0;
    }
`;
