import Lottie, { type LottieComponentProps } from 'lottie-react';
import styled from 'styled-components';

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
`;

type LottiePlayerProps = Pick<
    LottieComponentProps,
    'animationData' | 'loop' | 'autoplay' | 'lottieRef'
>;

export const LottiePlayer = ({ animationData, loop, autoplay, lottieRef }: LottiePlayerProps) => (
    <StyledLottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
    />
);
