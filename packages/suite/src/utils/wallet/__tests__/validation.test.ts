import { isAddressValid } from '../validation';

describe('validation', () => {
    it('is address valid', () => {
        // btc
        expect(isAddressValid('1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX', 'btc')).toEqual(true);
        expect(isAddressValid('1F1tAaz5x1HUXrCNLbsMDqcw6o5GNn4xqX0', 'btc')).toEqual(false);
        expect(isAddressValid('mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy', 'test')).toEqual(true);
        expect(isAddressValid('mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy0', 'test')).toEqual(false);
        // eth
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D88', 'eth')).toEqual(true);
        expect(isAddressValid('0x32Be343B94f860124dC4fEe278FDCBD38C102D880', 'eth')).toEqual(false);
        expect(isAddressValid('0x6212Dd88f890FefE0Af24D1404d96aDF488e4E3B', 'trop')).toEqual(true);
        expect(isAddressValid('0x6212Dd88f890FefE0Af24D1404d96aDF488e4E3B0', 'trop')).toEqual(
            false,
        );
        // xrp
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV', 'xrp')).toEqual(true);
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV0', 'xrp')).toEqual(false);
        expect(isAddressValid('rUfqCWNJ8UVhDVwwDMubYoHZq8RrZ3DifT', 'txrp')).toEqual(true);
        expect(isAddressValid('rUfqCWNJ8UVhDVwwDMubYoHZq8RrZ3DifT0', 'txrp')).toEqual(false);
    });
});
