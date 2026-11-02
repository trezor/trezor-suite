import { LottieLight, type LottieLightProps } from 'lottie-react';
import styled from 'styled-components';

// Light build of the engine (svg renderer only, no expressions engine): none of our animations
// need either, and it is ~28 kB gzip smaller. Adding an animation that does would silently break.
const StyledLottie = styled(LottieLight)`
    width: 100%;
    height: 100%;
`;

type LottiePlayerProps = Pick<LottieLightProps, 'src' | 'loop' | 'autoplay' | 'lottieRef'>;

export const LottiePlayer = ({ src, loop, autoplay, lottieRef }: LottiePlayerProps) => (
    <StyledLottie lottieRef={lottieRef} src={src} loop={loop} autoplay={autoplay} />
);
