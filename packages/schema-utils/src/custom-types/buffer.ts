import { TypeRegistry, Kind, TSchema, JavaScriptTypeBuilder, CreateType } from '@sinclair/typebox';

export interface TBuffer extends TSchema {
    [Kind]: 'Buffer';
    static: Buffer;
    type: 'Buffer';
}
TypeRegistry.Set('Buffer', (_: TBuffer, value: unknown) => value instanceof Buffer);

export class BufferBuilder extends JavaScriptTypeBuilder {
    Buffer(options?: TSchema): TBuffer {
        return CreateType({ [Kind]: 'Buffer', type: 'Buffer' }, options) as never;
    }
}
