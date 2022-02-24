import React from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { LOGOS } from './logos';
import { TrezorLogoType, TrezorLogoVariant } from '../../../support/types';

const SvgWrapper = styled.div<Omit<TrezorLogoProps, 'type'>>`
    display: inline-block;
    width: ${props => props.width};
    height: ${props => props.height};

    div {
        height: ${props => props.height};
    }
`;

const StyledReactSVG = styled(ReactSVG)`
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

export interface TrezorLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: TrezorLogoType;
    width?: string | number;
    height?: string | number;
}

const TrezorLogo = ({ type, width = 'auto', height = 'auto', ...rest }: TrezorLogoProps) => (
    <SvgWrapper
        width={typeof width === 'number' ? `${width}px` : width}
        height={typeof height === 'number' ? `${height}px` : height}
        {...rest}
    >
        <StyledReactSVG
            src={LOGOS[type.toUpperCase()]}
            beforeInjection={(svg: SVGElement) => {
                if (typeof height === 'number') {
                    svg.setAttribute('height', `${height}px`);
                }
            }}
            loading={() => <span className="loading" />}
        />
    </SvgWrapper>
);

export { TrezorLogo };
