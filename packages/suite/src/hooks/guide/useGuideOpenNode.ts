import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';

import { openNode } from 'src/actions/suite/guideActions';
import { useGuide } from 'src/hooks/guide';
import { useSelector } from 'src/hooks/suite';
import { selectGuideIndexNode } from 'src/selectors/suite/guideSelectors';
import { getNodeById } from 'src/utils/suite/guide';

export const useGuideOpenNode = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isGuideOpen, openGuide } = useGuide();

    const indexNode = useSelector(selectGuideIndexNode);
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
