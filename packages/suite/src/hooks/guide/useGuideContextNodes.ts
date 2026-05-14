import { useMemo } from 'react';

import { selectRouteName } from '@suite/router';
import { type GuideCategory, type GuideNode } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getGuideContextArticleIds, getNodeById } from 'src/utils/suite/guide';

const isGuideNode = (node: GuideNode | undefined): node is GuideNode => node !== undefined;

export const useGuideContextNodes = (pageRoot: GuideCategory | null) => {
    const routeName = useSelector(selectRouteName);
    const selectedAccount = useSelector(selectSelectedAccount);

    const networkSymbol = selectedAccount?.symbol;
    const networkType = selectedAccount?.networkType;

    return useMemo(() => {
        if (!pageRoot) {
            return [];
        }

        return getGuideContextArticleIds({
            routeName,
            networkSymbol,
            networkType,
        })
            .map(guideArticleId => getNodeById(guideArticleId, pageRoot))
            .filter(isGuideNode);
    }, [networkSymbol, networkType, pageRoot, routeName]);
};
