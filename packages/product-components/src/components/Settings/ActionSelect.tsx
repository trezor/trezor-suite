import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Select, type SelectProps, Tooltip, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

const { SCREEN_SIZE } = variables;

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
