import React, { useEffect, useState } from 'react';

import Lottie, { type LottieOptions } from 'lottie-react';
import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';

import { AnimationWrapper, type Shape } from './AnimationPrimitives';

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
`;

export type LottieType = 'BLOCK' | 'MEMPOOL';

type LottieAnimationProps = {
    size?: number;
    type: LottieType;
    loop?: boolean;
    shape?: Shape;
};

export const LottieAnimation = ({
    size,
    type,
    loop = false,
    shape,
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
            } catch {
                // do not need to handle error
            }
        };

        if (type === 'BLOCK') {
            loadAnimation('cubes_line');
        } else if (type === 'MEMPOOL') {
            loadAnimation('square_stack');
        }

        return () => {
            abortController.abort();
        };
    }, [type]);

    return (
        <AnimationWrapper $height={size} $width={size} shape={shape} {...props}>
            <>
                {lottieAnimationData && (
                    <StyledLottie animationData={lottieAnimationData} loop={loop} />
                )}
            </>
        </AnimationWrapper>
    );
};
