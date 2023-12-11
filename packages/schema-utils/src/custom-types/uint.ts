import { TypeRegistry, Kind, TSchema, JavaScriptTypeBuilder } from '@sinclair/typebox';

export interface TUintOptions {
    allowNegative?: boolean;
}
export interface TUint extends TUintOptions, TSchema {
    [Kind]: 'Uint';
    static: string | number;
    type: 'Uint';
}
TypeRegistry.Set('Uint', (schema: TUint, value: unknown) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return false;
    }
    if (
        (typeof value === 'number' && !Number.isSafeInteger(value)) ||
        !/^(?:[1-9]\d*|\d)$/.test(value.toString().replace(/^-/, schema.allowNegative ? '' : '-'))
    ) {
        return false;
    }
    return true;
});

export class UintBuilder extends JavaScriptTypeBuilder {
    Uint(options?: TUintOptions): TUint {
        return this.Create({ ...options, [Kind]: 'Uint', type: 'Uint' });
    }
}
