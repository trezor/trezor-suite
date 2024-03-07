import { ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';

import { LOGOS } from './trezorLogos';
import { TransientProps } from '../../..';

export type TrezorLogoType =
    | 'horizontal'
    | 'vertical'
    | 'symbol'
    | 'suite'
    | 'suite_square'
    | 'suite_compact';

const SvgWrapper = styled.div<{
    $width?: string | number;
    $height?: string | number;
}>`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    display: inline-block;
    width: ${({ $width }) => $width};
    height: ${({ $height }) => $height};

    div {
        height: ${({ $height }) => $height};
    }
`;

export interface TrezorLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    type: TrezorLogoType;
    width?: string | number;
    height?: string | number;
}

export const TrezorLogo = ({ type, width = 'auto', height = 'auto', ...rest }: TrezorLogoProps) => (
    <SvgWrapper
        $width={typeof width === 'number' ? `${width}px` : width}
        $height={typeof height === 'number' ? `${height}px` : height}
        {...rest}
    >
        <ReactSVG
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
