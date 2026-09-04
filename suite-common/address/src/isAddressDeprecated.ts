import { type AddressValidator } from '@suite-common/networks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

type IsAddressDeprecatedParams = {
    addressValidator: AddressValidator;
    address: string;
    symbol: NetworkSymbol;
};

const btcSymbol = asNetworkSymbol('btc');

export const isAddressDeprecated = ({
    addressValidator,
    address,
    symbol,
}: IsAddressDeprecatedParams) => {
    // catch deprecated address formats
    // LTC starting with "3" and valid with a BTC format
    if (
        symbol === 'ltc' &&
        address.startsWith('3') &&
        addressValidator.isAddressValid(address, btcSymbol)
    ) {
        return 'LTC_ADDRESS_INFO_URL';
    }
    // BCH starting with "1" and valid with a BTC format
    if (
        symbol === 'bch' &&
        address.startsWith('1') &&
        addressValidator.isAddressValid(address, btcSymbol)
    ) {
        return 'HELP_CENTER_CASHADDR_URL';
    }
};
