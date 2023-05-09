import styled, { css } from 'styled-components';
import React, { useEffect, useRef, useState } from 'react';
import Lottie, { LottieOptions } from 'lottie-react';
import * as semver from 'semver';
import { resolveStaticPath } from '@suite-common/suite-utils';

import { useTheme } from '@trezor/components';

import type { TrezorDevice } from '@suite/types/suite';
import { DeviceModel, getDeviceModel, getFirmwareVersion } from '@trezor/device-utils';

const Wrapper = styled.div<{ size?: number; shape?: Shape }>`
    width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

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
            border-radius: 8px;
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
    | 'NORMAL' // prompt to connect in normal mode (without holding buttons)
    | 'SUCCESS'
    | 'HOLOGRAM';

type Shape = 'CIRCLE' | 'ROUNDED' | 'ROUNDED-SMALL';

type DeviceAnimationProps = {
    size?: number;
    device?: TrezorDevice;
    type: DeviceAnimationType;
    loop?: boolean;
    shape?: Shape;
};

export const DeviceAnimation = ({
    size,
    type,
    loop = false,
    shape,
    device,
    ...props
}: DeviceAnimationProps) => {
    const { THEME } = useTheme();
    const hologramRef = useRef<HTMLVideoElement>(null);

    // if no Trezor available, show flagship model
    const deviceModel = (getDeviceModel(device) || DeviceModel.TT).toLowerCase();

    // T1 bootloader before firmware version 1.8.0 can only be invoked by holding both buttons
    const deviceFwVersion = device?.features ? getFirmwareVersion(device) : '';
    let animationType = type;
    if (
        type === 'BOOTLOADER' &&
        deviceModel === DeviceModel.T1 &&
        semver.valid(deviceFwVersion) &&
        semver.satisfies(deviceFwVersion, '<1.8.0')
    ) {
        animationType = 'BOOTLOADER_TWO_BUTTONS';
    }

    const [connectAnimationData, setConnectAnimationData] =
        useState<LottieOptions['animationData']>();

    useEffect(() => {
        let mounted = true;

        const loadConnectAnimation = async () => {
            const connectAnimation = await import(`./lottie/trezor_t${deviceModel}_connect.json`);
            if (mounted) setConnectAnimationData(connectAnimation);
        };

        if (animationType === 'CONNECT') {
            loadConnectAnimation();
        }

        return () => {
            mounted = false;
        };
    }, [animationType, deviceModel]);

    const animationFileName = animationType.toLowerCase();

    return (
        <Wrapper size={size} shape={shape} {...props}>
            <>
                {connectAnimationData && animationType === 'CONNECT' && (
                    <StyledLottie animationData={connectAnimationData} loop={loop} />
                )}
                {animationType === 'BOOTLOADER' && (
                    <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                        <source
                            src={resolveStaticPath(
                                `videos/onboarding/trezor_t${deviceModel}_${animationFileName}_${THEME}.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
                {animationType === 'BOOTLOADER_TWO_BUTTONS' && (
                    <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                        <source
                            src={resolveStaticPath(
                                `videos/onboarding/trezor_t${DeviceModel.T1}_${animationFileName}_${THEME}.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
                {animationType === 'NORMAL' && (
                    <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                        <source
                            src={resolveStaticPath(
                                `videos/onboarding/trezor_t${DeviceModel.T1}_${animationFileName}_${THEME}.webm`,
                            )}
                            type="video/webm"
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
                                `videos/onboarding/trezor_t${deviceModel}_${animationFileName}.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
                {animationType === 'SUCCESS' && (
                    <StyledVideo loop={loop} autoPlay muted width={size} height={size}>
                        <source
                            src={resolveStaticPath(
                                `videos/onboarding/trezor_t${deviceModel}_${animationFileName}_${THEME}.webm`,
                            )}
                            type="video/webm"
                        />
                    </StyledVideo>
                )}
            </>
        </Wrapper>
    );
};
