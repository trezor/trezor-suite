import { NetworkSymbol } from '@suite-common/wallet-config';
import { Card, CoinLogo, useElevation, variables } from '@trezor/components';
import { Elevation, mapElevationToBackground } from '@trezor/theme';
import { HTMLAttributes, ReactNode, forwardRef, ComponentProps } from 'react';
import styled, { css } from 'styled-components';

const EvmExplanationBoxWrapper = styled(Card)<{ caret?: boolean; elevation: Elevation }>`
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 18px;
    gap: 18px;
    border-radius: 8px;
    line-height: 1.25;

    ${({ caret, ...props }) =>
        caret &&
        css`
            &::before {
                position: absolute;
                content: '';
                width: 0;
                height: 0;
                top: -9px;
                left: 14px;
                border-bottom: 10px solid ${() => mapElevationToBackground(props)};
                border-left: 9px solid transparent;
                border-right: 9px solid transparent;
            }
        `}
`;

const EvmExplanationTitle = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 600;
    margin-bottom: 4px;
`;

const EvmExplanationDescription = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 18px;
`;

export interface EvmExplanationBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: ReactNode;
    symbol: NetworkSymbol;
    caret?: boolean;
    children?: ReactNode;
}

export const EvmExplanationBox = forwardRef<
    typeof EvmExplanationBoxWrapper,
    ComponentProps<typeof EvmExplanationBoxWrapper>
>(({ symbol, title, caret, children, ...rest }, ref) => {
    const { elevation } = useElevation();

    return (
        <EvmExplanationBoxWrapper ref={ref} caret={caret} elevation={elevation} {...rest}>
            <CoinLogo symbol={symbol} size={38} />
            <div>
                <EvmExplanationTitle>{title}</EvmExplanationTitle>
                <EvmExplanationDescription>{children}</EvmExplanationDescription>
            </div>
        </EvmExplanationBoxWrapper>
    );
});
