import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { useServices } from '@trezor/dependency-injection';

import { type TokenIconSize } from './tokenIconTypes';
import { injectGetCryptoIcon } from '../../services/networkServices';

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

type NativeTokenIconProps = {
    symbol: string;
    size?: TokenIconSize;
    'data-testid'?: string;
};

export const NativeTokenIcon = ({
    symbol,
    size = 32,
    'data-testid': dataTestId,
}: NativeTokenIconProps) => {
    const { getCryptoIcon } = useServices(injectGetCryptoIcon);
    const src = getCryptoIcon(symbol);

    if (!src) return null;

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
