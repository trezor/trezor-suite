import type { TSchema } from '@sinclair/typebox';
import { CreateType, JavaScriptTypeBuilder, Kind, TypeRegistry } from '@sinclair/typebox';

export interface TArrayBuffer extends TSchema {
    [Kind]: 'ArrayBuffer';
    static: ArrayBuffer;
    type: 'ArrayBuffer';
}
TypeRegistry.Set('ArrayBuffer', (_: TArrayBuffer, value: unknown) => value instanceof ArrayBuffer);

export class ArrayBufferBuilder extends JavaScriptTypeBuilder {
    ArrayBuffer(options?: TSchema): TArrayBuffer {
        return CreateType({ [Kind]: 'ArrayBuffer', type: 'ArrayBuffer' }, options) as never;
    }
}
