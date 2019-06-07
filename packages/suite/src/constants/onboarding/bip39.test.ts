import bip39wordList from './bip39';

describe('bip39', () => {
    it('should cointain string items', () => {
        expect(bip39wordList.length).toEqual(2048);
        bip39wordList.forEach(word => expect(typeof word).toEqual('string'));
    });
});
