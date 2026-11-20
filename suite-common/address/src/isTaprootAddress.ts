import { type AddressValidator } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type IsTaprootAddressParams = {
    addressValidator: AddressValidator;
    address: string;
    symbol: NetworkSymbol;
};

export const isTaprootAddress = ({ addressValidator, address, symbol }: IsTaprootAddressParams) =>
    addressValidator.getAddressType(symbol, address) === 'p2tr';
