import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';

export const TooltipWrap = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxxs};

    &:hover {
        div {
            color: ${({ theme }) => theme.textDefault};

            &::after {
                background: ${({ theme }) => theme.textDefault};
            }
        }

        path[fill] {
            fill: ${({ theme }) => theme.textDefault};
        }

        path[stroke] {
            stroke: ${({ theme }) => theme.textDefault};
        }
    }
`;

export const TooltipIcon = styled.div`
    margin-top: 1px;
    margin-right: ${spacingsPx.xs};
`;

export const TooltipText = styled.div<{ $isYellow?: boolean }>`
    position: relative;
    ${typography.hint}
    color: ${({ $isYellow, theme }) => ($isYellow ? theme.textAlertYellow : theme.textDefault)};
    transition: color 0.15s;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background: ${({ $isYellow, theme }) =>
            $isYellow ? theme.textAlertYellow : theme.textDefault};
        transition: background 0.15s;
    }
`;

export const CoinmarketTestWrapper = styled.div``;

export const CoinmarketFooterLogoWrapper = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    padding-top: 1px;
`;
