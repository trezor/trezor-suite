export type { AddressType } from '@trezor/network-module-suite-common-types';
export {
    createAddressValidator,
    selectAddressValidatorDep,
    type AddressValidator,
    type AddressValidatorDep,
    type AddressValidatorDeps,
} from './AddressValidator';
export { autocorrectAddress, type AddressCorrection } from './autocorrectAddress';
export { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';
export { isAddressDeprecated } from './isAddressDeprecated';
export { isBech32AddressUppercase } from './isBech32AddressUppercase';
export { isBitcoinCashAddressUppercase } from './isBitcoinCashAddressUppercase';
export { isTaprootAddress } from './isTaprootAddress';

export * from './evmChecksumUtils';
export * from './getFirstFreshAddress';
export { getUsedAddressesList } from './getUsedAddressesList';
