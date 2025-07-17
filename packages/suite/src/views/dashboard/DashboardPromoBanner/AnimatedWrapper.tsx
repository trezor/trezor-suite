import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { borders } from '@trezor/theme';

import { setFlag } from '../../../actions/suite/suiteActions';
import { useDispatch } from '../../../hooks/suite';
import { Flags } from '../../../reducers/suite/suiteReducer';
import { bannerAnimationConfig } from '../banner-animations';

const BannerWrapper = styled(motion.div)`
    width: 100%;
    border-radius: ${borders.radii.sm};
    overflow: hidden;
`;

type AnimatedWrapperProps = {
    children: React.ReactNode;
    isVisible: boolean;
    flagToHide: keyof Flags;
};

export const AnimatedWrapper = ({ children, isVisible, flagToHide }: AnimatedWrapperProps) => {
    const dispatch = useDispatch();

    return (
        <AnimatePresence>
            {isVisible && (
                <BannerWrapper
                    key="container"
                    {...bannerAnimationConfig}
                    onAnimationComplete={() => {
                        dispatch(setFlag(flagToHide, false));
                    }}
                >
                    {children}
                </BannerWrapper>
            )}
        </AnimatePresence>
    );
};
