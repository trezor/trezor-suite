import styled, { css } from 'styled-components';
import React, { useRef } from 'react';
import Lottie from 'lottie-react';
import * as semver from 'semver';

import { resolveStaticPath } from '@suite-utils/nextjs';
import { useTheme } from '@suite-hooks';
import LottieT1Connect from './lottie/t1_connect.json';
import LottieTTConnect from './lottie/tt_connect.json';
import { getDeviceModel, getFwVersion } from '@suite-utils/device';

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

    // T1 bootloader before firmware version 1.8.0 can only be invoked by holding both buttons
    const deviceFwVersion = device?.features ? getFwVersion(device) : '';
    let animationType = type;
    if (
        type === 'BOOTLOADER' &&
        deviceModel === '1' &&
        semver.valid(deviceFwVersion) &&
        semver.satisfies(deviceFwVersion, '<1.8.0')
    ) {
        animationType = 'BOOTLOADER_TWO_BUTTONS';
    }

    const animationFileName = animationType.toLowerCase();

    return (
        <Wrapper size={size} shape={shape} {...props}>
            {animationType === 'CONNECT' && (
                <StyledLottie
                    animationData={deviceModel === '1' ? LottieT1Connect : LottieTTConnect}
                    loop={loop}
                />
            )}
            {animationType === 'BOOTLOADER' && (
                <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t${deviceModel}_${animationFileName}_${themeVariant}.mp4`,
                        )}
                        type="video/mp4"
                    />
                </StyledVideo>
            )}
            {animationType === 'BOOTLOADER_TWO_BUTTONS' && (
                <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t1_${animationFileName}_${themeVariant}.mp4`,
                        )}
                        type="video/mp4"
                    />
                </StyledVideo>
            )}
            {animationType === 'HOLOGRAM' && (
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
                            `videos/onboarding/t${deviceModel}_${animationFileName}.webm`,
                        )}
                        type="video/webm"
                    />
                </StyledVideo>
            )}
            {animationType === 'SUCCESS' && (
                <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                    <source
                        src={resolveStaticPath(
                            `videos/onboarding/t${deviceModel}_${animationFileName}_${themeVariant}.webm`,
                        )}
                        type="video/webm"
                    />
                </StyledVideo>
            )}
        </Wrapper>
    );
};

export default DeviceAnimation;
