import styled, { css } from 'styled-components';
import React, { useRef } from 'react';
import Lottie from 'lottie-react';

import { resolveStaticPath } from '@suite-utils/nextjs';
import { useTheme } from '@suite-hooks';
import LottieT1Connect from './lottie/t1_connect.json';
import LottieTTConnect from './lottie/tt_connect.json';
import { getDeviceModel } from '@suite-utils/device';

import type { TrezorDevice } from '@suite/types/suite';

const Wrapper = styled.div<{ size?: number; shape?: Shape }>`
    width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;

    ${props =>
        props.size &&
        css`
            width: ${props.size}px;
            height: ${props.size}px;
        `}
    ${props =>
        props.shape === 'CIRCLE' &&
        css`
            border-radius: 50%;
        `};
    ${props =>
        props.shape === 'ROUNDED' &&
        css`
            border-radius: 30px;
        `};
    ${props =>
        props.shape === 'ROUNDED-SMALL' &&
        css`
            border-radius: 6px;
        `};
`;

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
    background: ${props => props.theme.BG_GREY};
`;

const StyledVideo = styled.video`
    width: 100%;
    height: 100%;
`;

export type DeviceAnimationType =
    | 'CONNECT'
    | 'BOOTLOADER'
    | 'BOOTLOADER_TWO_BUTTONS'
    | 'SUCCESS'
    | 'HOLOGRAM';

type Shape = 'CIRCLE' | 'ROUNDED' | 'ROUNDED-SMALL';

type Props = {
    size?: number;
    device?: TrezorDevice;
    type: DeviceAnimationType;
    loop?: boolean;
    shape?: Shape;
};

const DeviceAnimation = ({ size, type, loop = false, shape, device, ...props }: Props) => {
    const { themeVariant } = useTheme();

    const hologramRef = useRef<HTMLVideoElement>(null);

    // if device features are not available, use T model animations
    const deviceModel = device?.features ? getDeviceModel(device) : 'T';
    const animationType = type.toLowerCase();

    return (
        <Wrapper size={size} shape={shape} {...props}>
            {type === 'CONNECT' && (
                <StyledLottie
                    animationData={deviceModel === '1' ? LottieT1Connect : LottieTTConnect}
                    loop={loop}
                />
            )}
            {type === 'BOOTLOADER' && (
                <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t${deviceModel}_${animationType}_${themeVariant}.mp4`,
                        )}
                        type="video/mp4"
                    />
                </StyledVideo>
            )}
            {type === 'BOOTLOADER_TWO_BUTTONS' && (
                <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t1_${animationType}_${themeVariant}.mp4`,
                        )}
                        type="video/mp4"
                    />
                </StyledVideo>
            )}
            {type === 'HOLOGRAM' && (
                <StyledVideo
                    loop={loop}
                    autoPlay
                    muted
                    ref={hologramRef}
                    onMouseOver={() => {
                        // If the video is placed in tooltip it stops playing after tooltip minimizes and won't start again
                        // As a quick workaround user can hover a mouse to play it again
                        hologramRef.current?.play();
                    }}
                >
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t${deviceModel}_${animationType}.webm`,
                        )}
                        type="video/webm"
                    />
                </StyledVideo>
            )}
            {type === 'SUCCESS' && (
                <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t${deviceModel}_${animationType}_${themeVariant}.webm`,
                        )}
                        type="video/webm"
                    />
                </StyledVideo>
            )}
        </Wrapper>
    );
};

export default DeviceAnimation;
