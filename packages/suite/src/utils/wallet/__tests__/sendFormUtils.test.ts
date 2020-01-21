import { OUTPUTS } from '../__fixtures__/sendFormFixtures';
import { getOutput, hasDecimals, shouldComposeBy } from '../sendFormUtils';

describe('sendForm utils', () => {
    it('get output', () => {
        expect(getOutput(OUTPUTS.BASIC, 1)).toBe(OUTPUTS.BASIC[0]);
        expect(getOutput(OUTPUTS.BASIC, 2)).toBe(OUTPUTS.BASIC[1]);
        expect(getOutput(OUTPUTS.BASIC, 3)).toBe(OUTPUTS.BASIC[2]);
    });

    it('should compose', () => {
        const COMPOSE = true;
        const SHOULD_NOT_COMPOSE = false;

        expect(shouldComposeBy('address', OUTPUTS.NO_ERROR_ADDRESS)).toBe(COMPOSE);
        expect(shouldComposeBy('address', OUTPUTS.ADDRESS_EMPTY)).toBe(SHOULD_NOT_COMPOSE);
        expect(shouldComposeBy('address', OUTPUTS.ADDRESS_ERROR)).toBe(SHOULD_NOT_COMPOSE);

        expect(shouldComposeBy('amount', OUTPUTS.NO_ERROR_AMOUNT)).toBe(COMPOSE);
        expect(shouldComposeBy('amount', OUTPUTS.AMOUNT_ERROR)).toBe(SHOULD_NOT_COMPOSE);
        expect(shouldComposeBy('amount', OUTPUTS.AMOUNT_EMPTY)).toBe(SHOULD_NOT_COMPOSE);
    });

    it('hasDecimals', () => {
        expect(hasDecimals('0', 18)).toBe(true);
        expect(hasDecimals('0.0', 18)).toBe(true);
        expect(hasDecimals('0.00000000', 18)).toBe(true);
        expect(hasDecimals('0.00000001', 18)).toBe(true);
        expect(hasDecimals('+0.0', 18)).toBe(false);
        expect(hasDecimals('-0.0', 18)).toBe(false);
        expect(hasDecimals('1', 18)).toBe(true);
        expect(hasDecimals('+1', 18)).toBe(false);
        expect(hasDecimals('+100000', 18)).toBe(false);
        expect(hasDecimals('.', 18)).toBe(false);
        expect(hasDecimals('-.1', 18)).toBe(false);
        expect(hasDecimals('0.1', 18)).toBe(true);
        expect(hasDecimals('0.12314841', 18)).toBe(true);
        expect(hasDecimals('0.1381841848184814818391931933', 18)).toBe(false);
        expect(hasDecimals('0.100000000000000000', 18)).toBe(true);

        expect(hasDecimals('100.', 18)).toBe(true);
        expect(hasDecimals('.1', 18)).toBe(false);
        expect(hasDecimals('.000000001', 18)).toBe(false);
        expect(hasDecimals('.13134818481481841', 18)).toBe(false);

        expect(hasDecimals('001.12314841', 18)).toBe(false);
        expect(hasDecimals('83819319391491949941', 18)).toBe(true);
        expect(hasDecimals('-83819319391491949941', 18)).toBe(false);
        expect(hasDecimals('+0.131831848184', 18)).toBe(false);
        expect(hasDecimals('0.127373193981774718318371831731761626162613', 18)).toBe(false);

        expect(hasDecimals('0.131831848184a', 18)).toBe(false);
        expect(hasDecimals('100a', 18)).toBe(false);
        expect(hasDecimals('.100a', 18)).toBe(false);
        expect(hasDecimals('a.100', 18)).toBe(false);
        expect(hasDecimals('abc', 18)).toBe(false);
        expect(hasDecimals('1abc0', 18)).toBe(false);
    });
});
