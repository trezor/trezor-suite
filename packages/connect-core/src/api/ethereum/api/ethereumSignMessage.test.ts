import EthereumSignMessage from './ethereumSignMessage';

const getButtonRequestCoin = (path: string) =>
    new EthereumSignMessage({
        payload: { method: 'ethereumSignMessage', path, message: 'hello' },
    }).getButtonRequestData('ButtonRequest_Other', 'sign_message')?.coin;

describe('EthereumSignMessage button request data', () => {
    // Known limitation, not intended behaviour: the network is resolved from the slip44 path
    // element alone and ETH is the first slip44 60 entry in the bundled coin data, so every EVM
    // network other than ETC - all of which derive from m/44'/60' - is still reported as ETH, and
    // so is any unknown coin type. Tracked as a follow-up; this fix only covers ETC.
    it.each([
        ["m/44'/60'/0'/0/0", 'ETH'],
        ["m/44'/61'/0'/0/0", 'ETC'],
        ["m/44'/1'/0'/0/0", 'ETH'],
    ])('reports the network of %s as %s', (path, coin) => {
        expect(getButtonRequestCoin(path)).toBe(coin);
    });
});
