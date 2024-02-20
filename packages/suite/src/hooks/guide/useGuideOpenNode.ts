import { analytics, EventType } from '@trezor/suite-analytics';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { openNode } from 'src/actions/suite/guideActions';
import { getNodeById } from 'src/utils/suite/guide';
import { useGuide } from 'src/hooks/guide';

export const useGuideOpenNode = () => {
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
            type: EventType.GuideTooltipLinkNavigation,
            payload: {
                id: node.id,
            },
        });
    };

    return {
        openNodeById,
    };
};
