import * as fixtures from './__fixtures__/messageSystemValidation';
import * as messageSystem from './messageSystemValidation';

describe('Message system validation', () => {
    describe('stripFieldFromMessage', () => {
        fixtures.stripFieldFromMessage.forEach(f => {
            it(f.description, () => {
                expect(messageSystem.stripFieldFromMessage(f.input)).toEqual(f.result);
            });
        });
    });
});
