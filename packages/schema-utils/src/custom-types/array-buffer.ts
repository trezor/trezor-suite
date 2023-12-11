import { TypeRegistry, Kind, TSchema, JavaScriptTypeBuilder } from '@sinclair/typebox';

export interface TArrayBuffer extends TSchema {
    [Kind]: 'ArrayBuffer';
    static: ArrayBuffer;
    type: 'ArrayBuffer';
}
TypeRegistry.Set('ArrayBuffer', (_: TArrayBuffer, value: unknown) => value instanceof ArrayBuffer);

export class ArrayBufferBuilder extends JavaScriptTypeBuilder {
    ArrayBuffer(options?: TSchema): TArrayBuffer {
        return this.Create({ ...options, [Kind]: 'ArrayBuffer', type: 'ArrayBuffer' });
    }
}
