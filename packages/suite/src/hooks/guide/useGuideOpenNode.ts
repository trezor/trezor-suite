import { useActions, useSelector, useAnalytics } from '@suite-hooks';
import * as guideActions from '@suite-actions/guideActions';
import { getNodeById } from '@suite-utils/guide';
import { useGuide } from '@guide-hooks';

export const useGuideOpenNode = () => {
    const analytics = useAnalytics();
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
            type: 'guide/tooltip-link/navigation',
            payload: {
                id: node.id,
            },
        });
    };

    return {
        openNodeById,
    };
};
