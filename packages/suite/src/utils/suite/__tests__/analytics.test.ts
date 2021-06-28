import { encodeDataToQueryString } from '../analytics';
import fixtures from '../__fixtures__/analytics';

describe('analytics', () => {
    fixtures.forEach(f => {
        it(f.input.type, () => {
            jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());

            expect(
                encodeDataToQueryString(f.input, {
                    instanceId: '1',
                    sessionId: '2',
                    version: '1.0',
                }),
            ).toEqual(f.encoded);
        });
    });
});
