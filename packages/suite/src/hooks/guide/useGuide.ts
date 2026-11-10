import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { close, open } from '../../actions/suite/guideActions';
import { selectIsGuideOpen } from '../../selectors/suite/guideSelectors';
import { useLayoutSize, usePreferredModal, useSelector } from '../suite';

export const GUIDE_ANIMATION_DURATION_MS = 300;

export const useGuide = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const isGuideOpen = useSelector(selectIsGuideOpen);

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
                type: events.menuGuideEvent.name,
            });

            return dispatch(open());
        },
        closeGuide: () => dispatch(close()),
    };
};
