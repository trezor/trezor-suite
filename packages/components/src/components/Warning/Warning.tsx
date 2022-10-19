import React from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';

import { Icon } from '../Icon';
import { useTheme } from '../../utils';
import { variables } from '../../config';

const Wrapper = styled.div<Pick<WarningProps, 'critical' | 'withIcon'>>`
    align-items: center;
    background: ${({ critical, theme }) =>
        transparentize(0.9, critical ? theme.BG_RED : theme.TYPE_DARK_ORANGE)};
    border-radius: 8px;
    color: ${({ critical, theme }) => (critical ? theme.TYPE_DARK_GREY : theme.TYPE_DARK_ORANGE)};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    justify-content: ${({ withIcon }) => !withIcon && 'center'};
    padding: 14px 20px;
    width: 100%;
`;

const StyledIcon = styled(Icon)`
    margin-right: 14px;
`;

interface WarningProps {
    children: React.ReactNode;
    className?: string;
    critical?: boolean;
    withIcon?: boolean;
}

export const Warning = ({ children, className, critical, withIcon }: WarningProps) => {
    const theme = useTheme();

    const iconColor = critical ? theme.TYPE_RED : theme.TYPE_DARK_ORANGE;

    return (
        <Wrapper critical={critical} withIcon={withIcon} className={className}>
            {withIcon && <StyledIcon size={20} icon="WARNING" color={iconColor} />}
            {children}
        </Wrapper>
    );
};
