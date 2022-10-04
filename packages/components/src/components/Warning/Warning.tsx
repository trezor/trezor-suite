import React from 'react';
import styled from 'styled-components';
import { darken, transparentize } from 'polished';

import { Icon } from '../Icon';
import { useTheme } from '../../utils';

const Wrapper = styled.div<Pick<WarningProps, 'critical' | 'withIcon'>>`
    align-items: center;
    background: ${({ critical, theme }) =>
        transparentize(0.9, critical ? theme.BG_RED : theme.TYPE_DARK_ORANGE)};
    border-radius: 8px;
    color: ${({ critical, theme }) => (critical ? theme.TYPE_DARK_GREY : theme.TYPE_DARK_ORANGE)};
    display: flex;
    font-weight: 500;
    justify-content: ${({ withIcon }) => !withIcon && 'center'};
    padding: 10px 12px;
    width: 100%;
`;

const StyledIcon = styled(Icon)`
    margin-right: 8px;
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
            {withIcon && <StyledIcon size={18} icon="WARNING" color={iconColor} />}
            {children}
        </Wrapper>
    );
};
