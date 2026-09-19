import Lottie, { type LottieOptions, type LottieRef } from 'lottie-react';
import styled from 'styled-components';

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
`;

type LottiePlayerProps = {
    animationData: LottieOptions['animationData'];
    loop: boolean;
    autoplay: boolean;
    lottieRef?: LottieRef;
};

export const LottiePlayer = ({ animationData, loop, autoplay, lottieRef }: LottiePlayerProps) => (
    <StyledLottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
    />
);
