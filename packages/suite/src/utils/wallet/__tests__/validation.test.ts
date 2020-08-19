import { isAddressValid, isDecimalsValid } from '../validation';

describe('validation', () => {
    it('isAddressValid', () => {
        // btc
        expect(isAddressValid('1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX', 'btc')).toEqual(true);
        expect(isAddressValid('1F1tAaz5x1HUXrCNLbsMDqcw6o5GNn4xqX0', 'btc')).toEqual(false);
        expect(isAddressValid('mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy', 'test')).toEqual(true);
        expect(isAddressValid('mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy0', 'test')).toEqual(false);
        // trop
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D88', 'trop')).toEqual(true);
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D880', 'trop')).toEqual(
            false,
        );
        // eth
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D88', 'eth')).toEqual(true);
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D880', 'eth')).toEqual(false);
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D880', 'trop')).toEqual(
            false,
        );
        // xrp
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV', 'xrp')).toEqual(true);
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV', 'txrp')).toEqual(true);
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV0', 'xrp')).toEqual(false);
        // txrp
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV', 'txrp')).toEqual(true);
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV0', 'txrp')).toEqual(false);
    });

    it('isDecimalsValid', () => {
        expect(isDecimalsValid('0', 18)).toBe(true);
        expect(isDecimalsValid('0.0', 18)).toBe(true);
        expect(isDecimalsValid('0.00000000', 18)).toBe(true);
        expect(isDecimalsValid('0.00000001', 18)).toBe(true);
        expect(isDecimalsValid('+0.0', 18)).toBe(false);
        expect(isDecimalsValid('-0.0', 18)).toBe(false);
        expect(isDecimalsValid('1', 18)).toBe(true);
        expect(isDecimalsValid('+1', 18)).toBe(false);
        expect(isDecimalsValid('+100000', 18)).toBe(false);
        expect(isDecimalsValid('.', 18)).toBe(false);
        expect(isDecimalsValid('-.1', 18)).toBe(false);
        expect(isDecimalsValid('0.1', 18)).toBe(true);
        expect(isDecimalsValid('0.12314841', 18)).toBe(true);
        expect(isDecimalsValid('0.1381841848184814818391931933', 18)).toBe(false); // 28 decimals
        expect(isDecimalsValid('0.100000000000000000', 18)).toBe(true); // 18s decimals

        expect(isDecimalsValid('100.', 18)).toBe(true);
        expect(isDecimalsValid('.1', 18)).toBe(false);
        expect(isDecimalsValid('.000000001', 18)).toBe(false);
        expect(isDecimalsValid('.13134818481481841', 18)).toBe(false);

        expect(isDecimalsValid('001.12314841', 18)).toBe(false);
        expect(isDecimalsValid('83819319391491949941', 18)).toBe(true);
        expect(isDecimalsValid('-83819319391491949941', 18)).toBe(false);
        expect(isDecimalsValid('+0.131831848184', 18)).toBe(false);
        expect(isDecimalsValid('0.127373193981774718318371831731761626162613', 18)).toBe(false);

        expect(isDecimalsValid('0.131831848184a', 18)).toBe(false);
        expect(isDecimalsValid('100a', 18)).toBe(false);
        expect(isDecimalsValid('.100a', 18)).toBe(false);
        expect(isDecimalsValid('a.100', 18)).toBe(false);
        expect(isDecimalsValid('abc', 18)).toBe(false);
        expect(isDecimalsValid('1abc0', 18)).toBe(false);
    });
});
