import { useMemo } from 'react';
import { useSelector, useActions, useLayoutSize } from '@suite-hooks';
import * as guideActions from '@suite-actions/guideActions';
import { usePreferredModal } from '../suite/usePreferredModal';

export const GUIDE_ANIMATION_DURATION_MS = 300;

export const useGuide = () => {
    const isGuideOpen = useSelector(state => state.guide.open);

    const { layoutSize } = useLayoutSize();

    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });

    const isGuideOnTop = useMemo(
        () => ['NORMAL', 'SMALL', 'TINY'].includes(layoutSize),
        [layoutSize],
    );

    const isModalOpen = usePreferredModal().type !== 'none';

    return {
        isGuideOpen,
        isGuideOnTop,
        isModalOpen,
        openGuide,
        closeGuide,
    };
};
