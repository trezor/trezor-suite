import { EventType } from '@suite/analytics';

import { close, open } from 'src/actions/suite/guideActions';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

import { useAnalytics } from '../../support/useAnalytics';
import { usePreferredModal } from '../suite';

export const GUIDE_ANIMATION_DURATION_MS = 300;

export const useGuide = () => {
    const analytics = useAnalytics();
    const isGuideOpen = useSelector(state => state.guide.open);
    const dispatch = useDispatch();

    const { isBelowLaptop } = useLayoutSize();

    // The guide should be on top for smaller screens (below laptop size)
    const isGuideOnTop = isBelowLaptop;

    const isModalOpen = usePreferredModal().type !== 'none';

    return {
        isGuideOpen,
        isGuideOnTop,
        isModalOpen,
        openGuide: () => {
            analytics.report({
                type: EventType.MenuGuide,
            });

            return dispatch(open());
        },
        closeGuide: () => dispatch(close()),
    };
};
