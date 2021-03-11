import React from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { LOGOS } from './logos';
import { useTheme } from '../../../utils/hooks';
import { TrezorLogoType, TrezorLogoVariant } from '../../../support/types';

const SvgWrapper = styled.div<Omit<Props, 'type'>>`
    display: inline-block;
    width: ${props => props.width};
    height: ${props => props.height};

    div {
        height: ${props => props.height};
    }
`;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: TrezorLogoType;
    fillColor?: string;
    width?: string | number;
    height?: string | number;
}

const TrezorLogo = ({ type, fillColor, width = 'auto', height = 'auto', ...rest }: Props) => {
    const theme = useTheme();
    return (
        <SvgWrapper
            width={typeof width === 'number' ? `${width}px` : width}
            height={typeof height === 'number' ? `${height}px` : height}
            {...rest}
        >
            <ReactSVG
                src={LOGOS[type.toUpperCase()]}
                beforeInjection={svg => {
                    if (typeof height === 'number') {
                        svg.setAttribute('height', `${height}px`);
                    }
                    svg.setAttribute('fill', fillColor ?? theme.TYPE_DARK_GREY);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgWrapper>
    );
};

export { TrezorLogo, Props as TrezorLogoProps };
