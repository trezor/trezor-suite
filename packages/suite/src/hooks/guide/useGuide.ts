import { useMemo } from 'react';
import { useDispatch, useSelector, useLayoutSize } from 'src/hooks/suite';
import { close, open } from 'src/actions/suite/guideActions';
import { usePreferredModal } from '../suite/usePreferredModal';

export const GUIDE_ANIMATION_DURATION_MS = 300;

export const useGuide = () => {
    const isGuideOpen = useSelector(state => state.guide.open);
    const dispatch = useDispatch();

    const { layoutSize } = useLayoutSize();

    const isGuideOnTop = useMemo(
        () => ['NORMAL', 'SMALL', 'TINY'].includes(layoutSize),
        [layoutSize],
    );

    const isModalOpen = usePreferredModal().type !== 'none';

    return {
        isGuideOpen,
        isGuideOnTop,
        isModalOpen,
        openGuide: () => dispatch(open()),
        closeGuide: () => dispatch(close()),
    };
};
