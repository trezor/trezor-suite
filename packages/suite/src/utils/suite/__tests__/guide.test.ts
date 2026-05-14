import { GUIDE_ARTICLE_IDS } from 'src/constants/suite/guide';

import * as fixtures from '../__fixtures__/guide';
import * as guideUtils from '../guide';

describe('getNodeTitle', () => {
    fixtures.getNodeTitle.forEach(f => {
        it(f.description, () => {
            expect(guideUtils.getNodeTitle(f.input.node, f.input.language)).toEqual(f.result);
        });
    });
});

describe('getNodeById', () => {
    fixtures.getNodeById.forEach(f => {
        it(f.description, () => {
            expect(guideUtils.getNodeById(f.input.id, f.input.node)).toEqual(f.result);
        });
    });
});

describe('getAncestorIds', () => {
    fixtures.getAncestorIds.forEach(f => {
        it(f.description, () => {
            expect(guideUtils.getAncestorIds(f.input.id)).toEqual(f.result);
        });
    });
});

describe('findAncestorNodes', () => {
    fixtures.findAncestorNodes.forEach(f => {
        it(f.description, () => {
            expect(guideUtils.findAncestorNodes(f.input.node, f.input.root)).toEqual(f.result);
        });
    });
});

describe('getGuideContextArticleIds', () => {
    it('returns route-specific articles', () => {
        expect(guideUtils.getGuideContextArticleIds({ routeName: 'wallet-receive' })).toEqual([
            GUIDE_ARTICLE_IDS.receivingCrypto,
            GUIDE_ARTICLE_IDS.uriHandlers,
        ]);
    });

    it('prioritizes network-specific send articles', () => {
        expect(
            guideUtils.getGuideContextArticleIds({
                routeName: 'wallet-send',
                networkType: 'ripple',
            }),
        ).toEqual([
            GUIDE_ARTICLE_IDS.destinationTags,
            GUIDE_ARTICLE_IDS.sendingCrypto,
            GUIDE_ARTICLE_IDS.transactionFees,
            GUIDE_ARTICLE_IDS.replaceByFee,
            GUIDE_ARTICLE_IDS.coinControl,
        ]);
    });

    it('deduplicates network-specific staking articles', () => {
        expect(
            guideUtils.getGuideContextArticleIds({
                routeName: 'wallet-staking',
                networkSymbol: 'sol',
            }),
        ).toEqual([
            GUIDE_ARTICLE_IDS.solanaStaking,
            GUIDE_ARTICLE_IDS.ethereumStaking,
            GUIDE_ARTICLE_IDS.cardanoStaking,
        ]);
    });
});
