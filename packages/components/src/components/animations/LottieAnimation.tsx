import React, { useEffect, useMemo, useState } from 'react';

import Lottie, { type LottieOptions, type LottieRef } from 'lottie-react';
import styled from 'styled-components';

import { resolveStaticPath } from '@trezor/env-utils';

import { AnimationWrapper, type Shape } from './AnimationPrimitives';
import { recolorLottieAnimation } from './recolorLottieAnimation';

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
`;

export type LottieType = 'BLOCK' | 'MEMPOOL' | 'MASCOT';

const lottieFiles: Record<LottieType, string> = {
    BLOCK: 'cubes_line',
    MEMPOOL: 'square_stack',
    MASCOT: 'trezor_mascot',
};

// Cache fetched animation JSON per type so remounting a component (e.g. on navigation)
// reuses the already-loaded data instead of refetching and flashing an empty frame.
const animationDataCache: Partial<Record<LottieType, LottieOptions['animationData']>> = {};

type LottieAnimationProps = {
    size?: number;
    type: LottieType;
    loop?: boolean;
    autoplay?: boolean;
    shape?: Shape;
    lottieRef?: LottieRef;
    colorReplacements?: { from: string; to: string }[];
};

export const LottieAnimation = ({
    size,
    type,
    loop = false,
    autoplay = true,
    shape,
    lottieRef,
    colorReplacements,
    ...props
}: LottieAnimationProps) => {
    const [rawAnimationData, setRawAnimationData] = useState<LottieOptions['animationData']>(
        () => animationDataCache[type],
    );

    useEffect(() => {
        const cached = animationDataCache[type];
        if (cached) {
            setRawAnimationData(cached);

            return;
        }

        const abortController = new AbortController();

        const loadAnimation = async (animationPath: string) => {
            try {
                const animation = await (
                    await fetch(resolveStaticPath(`videos/lottie/${animationPath}.json`), {
                        signal: abortController.signal,
                    })
                ).json();

                animationDataCache[type] = animation;
                setRawAnimationData(animation);
            } catch {
                // do not need to handle error
            }
        };

        loadAnimation(lottieFiles[type]);

        return () => {
            abortController.abort();
        };
    }, [type]);

    const animationData = useMemo(
        () =>
            rawAnimationData && colorReplacements?.length
                ? recolorLottieAnimation(rawAnimationData, colorReplacements)
                : rawAnimationData,
        [rawAnimationData, colorReplacements],
    );

    return (
        <AnimationWrapper $height={size} $width={size} shape={shape} {...props}>
            <>
                {animationData && (
                    <StyledLottie
                        lottieRef={lottieRef}
                        animationData={animationData}
                        loop={loop}
                        autoplay={autoplay}
                    />
                )}
            </>
        </AnimationWrapper>
    );
};
