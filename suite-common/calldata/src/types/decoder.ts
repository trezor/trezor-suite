import { type Abi, type AbiParameterToPrimitiveType } from 'viem';

import { type ExtractAbiFunction, type NamedAbiParameter } from './abi';

export type DecodedAbiInputs<T extends Abi> =
    ExtractAbiFunction<T>['inputs'][number] extends infer P
        ? {
              [
                  Param in Extract<P, NamedAbiParameter> as Param['name']
              ]: AbiParameterToPrimitiveType<Param>;
          }
        : never;

export type Decoder<T extends Abi> = (data?: string) => DecodedAbiInputs<T> | null;
