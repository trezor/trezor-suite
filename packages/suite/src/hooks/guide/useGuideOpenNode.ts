import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';

import { openNode } from 'src/actions/suite/guideActions';
import { useGuide } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNodeById } from 'src/utils/suite/guide';

export const useGuideOpenNode = () => {
    const { analytics } = useServices<DesktopAnalyticsDep>();
    const { isGuideOpen, openGuide } = useGuide();

    const indexNode = useSelector(state => state.guide.indexNode);
    const dispatch = useDispatch();

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
