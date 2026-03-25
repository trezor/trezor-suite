import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Button, type ButtonProps, Tooltip, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

const { SCREEN_SIZE } = variables;

type WithTooltipProps = { tooltipContent?: ReactNode; isTooltipActive?: boolean };

export const ActionButton = styled(
    ({
        tooltipContent,
        isTooltipActive,
        children,
        ...buttonProps
    }: WithTooltipProps & ButtonProps) => (
        <div>
            <Tooltip content={tooltipContent} isActive={isTooltipActive} cursor="inherit">
                <Button
                    {...buttonProps}
                    margin={{ top: spacings.xxs, bottom: spacings.xxs, left: spacings.xxs }}
                    minWidth={140}
                >
                    {children}
                </Button>
            </Tooltip>
        </div>
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
