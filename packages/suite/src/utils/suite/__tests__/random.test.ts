import { getRandomId } from '../random';

describe('random', () => {
    describe('getRandomId', () => {
        it('should return random id of fixed length', () => {
            expect(getRandomId(12)).toHaveLength(12);
        });
        it('should generate few results which should be unique', () => {
            const ids: any = {};
            for (let i = 0; i < 10; i++) {
                const random = getRandomId(10);
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
