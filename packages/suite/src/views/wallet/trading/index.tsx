import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';

export const TooltipWrap = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};

    &:hover {
        div {
            color: ${({ theme }) => theme.contentPrimary};

            &::after {
                background: ${({ theme }) => theme.contentPrimary};
            }
        }

        path[fill] {
            fill: ${({ theme }) => theme.contentPrimary};
        }

        path[stroke] {
            stroke: ${({ theme }) => theme.contentPrimary};
        }
    }
`;

export const TooltipIcon = styled.div`
    margin-top: 1px;
    margin-right: ${spacingsPx.xs};
`;

export const TooltipText = styled.div<{ $isYellow?: boolean }>`
    position: relative;
    ${typography['body-sm']}
    color: ${({ $isYellow, theme }) => ($isYellow ? theme.contentWarning : theme.contentPrimary)};
    transition: color 0.15s;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background: ${({ $isYellow, theme }) =>
            $isYellow ? theme.contentWarning : theme.contentPrimary};
        transition: background 0.15s;
    }
`;

export const TradingTestWrapper = styled.div``;
