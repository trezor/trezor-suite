import { analytics, EventType } from '@trezor/suite-analytics';

import { useActions, useSelector } from 'src/hooks/suite';
import * as guideActions from 'src/actions/suite/guideActions';
import { getNodeById } from 'src/utils/suite/guide';
import { useGuide } from 'src/hooks/guide';

export const useGuideOpenNode = () => {
    const { isGuideOpen, openGuide } = useGuide();

    const { openNode } = useActions({
        openNode: guideActions.openNode,
    });

    const { indexNode } = useSelector(state => ({
        indexNode: state.guide.indexNode,
    }));

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

        openNode(node);

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
