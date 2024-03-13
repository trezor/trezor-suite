import { ReactSVG } from 'react-svg';
import styled, { useTheme } from 'styled-components';
import { LOGOS } from './trezorLogos';

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
    width: ${({ $width }) => $width};
    height: ${({ $height }) => $height};
`;

export interface TrezorLogoProps {
    type: TrezorLogoType;
    width?: string | number;
    height?: string | number;
    'data-test'?: string;
}

const Loading = () => <span className="loading" />;

export const TrezorLogo = ({ type, width = 'auto', height = 'auto', ...rest }: TrezorLogoProps) => {
    const theme = useTheme();

    return (
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
                    svg.setAttribute('fill', theme.iconDefault);
                }}
                loading={Loading}
            />
        </SvgWrapper>
    );
};
