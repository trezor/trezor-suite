import * as guideUtils from '../guide';
import * as fixtures from '../__fixtures__/guide';

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
