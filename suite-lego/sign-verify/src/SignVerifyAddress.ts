import { type ComponentType } from 'react';

export type SignVerifyAddressProps = {
    value: string;
};

export type SignVerifyAddress = ComponentType<SignVerifyAddressProps>;

export type SignVerifyAddressDep = {
    signVerifyAddress: SignVerifyAddress;
};

export const injectSignVerifyAddress = (services: any): SignVerifyAddressDep => ({
    signVerifyAddress: services.signVerifyAddress,
});
