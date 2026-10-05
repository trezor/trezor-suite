import EthereumSignMessage from './ethereumSignMessage';

const getButtonRequestCoin = (path: string) =>
    new EthereumSignMessage({
        payload: { method: 'ethereumSignMessage', path, message: 'hello' },
    }).getButtonRequestData('ButtonRequest_Other', 'sign_message')?.coin;

describe('EthereumSignMessage button request data', () => {
    it.each([
        ["m/44'/60'/0'/0/0", 'ETH'],
        // bug: params never carry the network, so Ethereum Classic falls back to ETH
        ["m/44'/61'/0'/0/0", 'ETH'],
        // no bundled network for this coin type
        ["m/44'/1'/0'/0/0", 'ETH'],
    ])('reports the network of %s as %s', (path, coin) => {
        expect(getButtonRequestCoin(path)).toBe(coin);
    });
});
