import { getWeakRandomId } from '../src/getWeakRandomId';

describe('random', () => {
    describe('getWeakRandomId', () => {
        it('should return random id of fixed length', () => {
            expect(getWeakRandomId(12)).toHaveLength(12);
        });
        it('should generate few results which should be unique', () => {
            const ids: any = {};
            for (let i = 0; i < 10; i++) {
                const random = getWeakRandomId(10);
                if (!ids[random]) {
                    ids[random] = 0;
                }
                ids[random]++;
            }
            Object.values(ids).forEach(id => {
                expect(id).toEqual(1);
            });
        });
    });
});
