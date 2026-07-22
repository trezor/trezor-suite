import { type NetworkSymbol } from '@suite-common/wallet-config';

import type { AddressValidator } from './AddressValidator';

type IsTaprootAddressParams = {
    addressValidator: AddressValidator;
    address: string;
    symbol: NetworkSymbol;
};

export const isTaprootAddress = ({ addressValidator, address, symbol }: IsTaprootAddressParams) =>
    addressValidator.getAddressType(address, symbol) === 'p2tr';
