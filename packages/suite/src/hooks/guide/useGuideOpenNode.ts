import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useGuide } from './useGuide';
import { openNode } from '../../actions/suite/guideActions';
import { selectGuideIndexNode } from '../../selectors/suite/guideSelectors';
import { getNodeById } from '../../utils/suite/guide';
import { useSelector } from '../suite';

export const useGuideOpenNode = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { isGuideOpen, openGuide } = useGuide();

    const indexNode = useSelector(selectGuideIndexNode);

    const openNodeById = (id: string) => {
        if (!indexNode) {
            console.error(`Guide index node was not found.`);

            return;
        }
        const node = getNodeById(id, indexNode);
        if (!node) {
            console.error(`Guide node with id: ${id} was not found.`);

            return;
        }

        dispatch(openNode(node));

        if (!isGuideOpen) {
            openGuide();
        }

        analytics.report({
            type: events.guideTooltipLinkNavigationEvent.name,
            payload: {
                id: node.id,
            },
        });
    };

    return {
        openNodeById,
    };
};
