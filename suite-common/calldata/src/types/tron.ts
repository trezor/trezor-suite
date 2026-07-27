import { type Branded } from '@trezor/type-utils';

export type TronAddress = string & Branded<'TronAddress'>;
export const asTronAddress = (address: string): TronAddress => address as TronAddress;

export type TronParamType = 'tron_address' | 'uint256';

export type TronParam = { readonly name: string; readonly type: TronParamType };

export type TronFunctionAbi = {
    readonly selector: string;
    readonly inputs: readonly TronParam[];
};

export type TronParamName<T extends TronFunctionAbi> = T['inputs'][number]['name'];
