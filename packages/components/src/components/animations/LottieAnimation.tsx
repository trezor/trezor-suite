import styled from 'styled-components';
import React, { useEffect, useState } from 'react';
import Lottie, { LottieOptions } from 'lottie-react';

import { DeviceModelInternal } from '@trezor/connect';
import { AnimationWrapper, Shape } from './AnimationPrimitives';
import { resolveStaticPath } from '../../utils/resolveStaticPath';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
`;

export type LottieType = 'CONNECT' | 'BLOCK' | 'MEMPOOL';

type LottieAnimationProps = {
    size?: number;
    type: LottieType;
    loop?: boolean;
    shape?: Shape;
    deviceModelInternal?: DeviceModelInternal;
};

export const LottieAnimation = ({
    size,
    type,
    loop = false,
    shape,
    deviceModelInternal = DEFAULT_FLAGSHIP_MODEL,
    ...props
}: LottieAnimationProps) => {
    const [lottieAnimationData, setLottieAnimationData] =
        useState<LottieOptions['animationData']>();

    useEffect(() => {
        const abortController = new AbortController();

        const loadAnimation = async (animationPath: string) => {
            try {
                const animation = await (
                    await fetch(resolveStaticPath(`videos/lottie/${animationPath}.json`), {
                        signal: abortController.signal,
                    })
                ).json();

                setLottieAnimationData(animation);
            } catch (error) {
                // do not need to handle error
            }
        };

        if (type === 'CONNECT') {
            loadAnimation(
                `trezor_${(deviceModelInternal === DeviceModelInternal.T2B1 ? DeviceModelInternal.T3B1 : deviceModelInternal).toLowerCase()}_connect`,
            );
        } else if (type === 'BLOCK') {
            loadAnimation('cubes_line');
        } else if (type === 'MEMPOOL') {
            loadAnimation('square_stack');
        }

        return () => {
            abortController.abort();
        };
    }, [type, deviceModelInternal]);

    return (
        <AnimationWrapper height={`${size}px`} width={`${size}px`} shape={shape} {...props}>
            <>
                {lottieAnimationData && (
                    <StyledLottie animationData={lottieAnimationData} loop={loop} />
                )}
            </>
        </AnimationWrapper>
    );
};
