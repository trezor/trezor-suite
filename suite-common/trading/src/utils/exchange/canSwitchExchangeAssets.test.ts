import { asNetworkSymbol } from '@suite-common/wallet-config';

import { canSwitchExchangeAssets } from './canSwitchExchangeAssets';
import { getCryptoId } from '../../utils';

const BTC_CRYPTO_ID = getCryptoId(asNetworkSymbol('btc'));
const ETH_CRYPTO_ID = getCryptoId(asNetworkSymbol('eth'));

const SWITCHABLE_PARAMS = {
    sendCryptoId: BTC_CRYPTO_ID,
    receiveCryptoId: ETH_CRYPTO_ID,
    sellCryptoIds: [BTC_CRYPTO_ID, ETH_CRYPTO_ID],
    buyCryptoIds: [BTC_CRYPTO_ID, ETH_CRYPTO_ID],
};

describe('canSwitchExchangeAssets', () => {
    it('allows the switch when both assets are swappable the other way round', () => {
        expect(canSwitchExchangeAssets(SWITCHABLE_PARAMS)).toBe(true);
    });

    it.each([
        ['the send asset is missing', { sendCryptoId: undefined }],
        ['the receive asset is missing', { receiveCryptoId: undefined }],
        ['the receive asset cannot be sold', { sellCryptoIds: [BTC_CRYPTO_ID] }],
        ['the send asset cannot be bought', { buyCryptoIds: [ETH_CRYPTO_ID] }],
    ])('blocks the switch when %s', (_, override) => {
        expect(canSwitchExchangeAssets({ ...SWITCHABLE_PARAMS, ...override })).toBe(false);
    });
});
