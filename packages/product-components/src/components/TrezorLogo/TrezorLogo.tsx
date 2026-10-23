import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    type TransientProps,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '@trezor/components';

import { LOGOS } from './trezorLogos';

export const allowedTrezorLogoFrameProps = [
    'margin',
    'width',
    'height',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedTrezorLogoFrameProps)[number]>;

export const trezorLogoTypes = ['horizontal', 'vertical', 'symbol'] as const;
type TrezorLogoType = (typeof trezorLogoTypes)[number];

const SvgWrapper = styled.div<TransientProps<AllowedFrameProps>>`
    ${withFrameProps};

    /* Not in beforeInjection: react-svg doesn't re-inject on theme change, the fill would go stale. */
    svg {
        fill: ${({ theme }) => theme.contentPrimary};
    }
`;

export type TrezorLogoProps = AllowedFrameProps & {
    type: TrezorLogoType;
    'data-testid'?: string;
};

const Loading = () => <span className="loading" />;

export const TrezorLogo = ({ type, width = 'auto', height = 'auto', ...rest }: TrezorLogoProps) => {
    const frameProps = pickAndPrepareFrameProps(
        { ...rest, width, height },
        allowedTrezorLogoFrameProps,
    );

    return (
        <SvgWrapper {...frameProps}>
            <ReactSVG
                src={LOGOS[type.toUpperCase()]}
                beforeInjection={(svg: SVGElement) => {
                    if (typeof height === 'number') {
                        svg.setAttribute('height', `${height}px`);
                    }
                }}
                loading={Loading}
            />
        </SvgWrapper>
    );
};
