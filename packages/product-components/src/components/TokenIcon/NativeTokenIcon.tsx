import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { type CryptoIconName, cryptoIcons, isCryptoIconSymbol } from '@suite-common/icons';

import { type TokenIconProps, type TokenIconSize } from './tokenIconTypes';

const SvgContainer = styled.div<{ $size: TokenIconSize }>`
    display: flex;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const StyledReactSVG = styled(ReactSVG)`
    display: flex;
    width: 100%;
    height: 100%;

    div {
        display: flex;
        width: 100%;
        height: 100%;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
    }
` as typeof ReactSVG;

type NativeTokenIconProps = TokenIconProps;

export const NativeTokenIcon = ({
    symbol,
    size = 32,
    'data-testid': dataTestId,
}: NativeTokenIconProps) => {
    if (!isCryptoIconSymbol(symbol)) {
        return null;
    }

    const iconName: CryptoIconName = symbol;
    const src = cryptoIcons[iconName];

    return (
        <SvgContainer $size={size} data-testid={dataTestId}>
            <StyledReactSVG
                src={src}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgContainer>
    );
};
