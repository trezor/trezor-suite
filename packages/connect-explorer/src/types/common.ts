export interface FieldData {
    value: string;
    label: string;
    affectedValue?: string;
}

// Field path
// - string: object name
// - number: batch index
export type FieldPath = (string | number)[];

export interface FieldCommon {
    path?: FieldPath;
    name: string;
    optional?: boolean;
    omit?: boolean;
}

export interface FieldBasic<Value> extends FieldCommon {
    type:
        | 'input'
        | 'input-long'
        | 'select'
        | 'checkbox'
        | 'textarea'
        | 'number'
        | 'address'
        | 'json'
        | 'function'
        | 'file';
    value: Value;
    defaultValue?: Value;
    affect?: string;
    data?: FieldData[];
}

interface Batch<Value> {
    type: string;
    fields: Field<Value>[];
}

export interface FieldWithBundle<Value> extends FieldCommon {
    type: 'array';
    batch: Batch<Value>[];
    items: Field<Value>[][];
    affect?: undefined;
}

export interface FieldWithUnion<Value> extends FieldCommon {
    type: 'union';
    labels: string[];
    options: Field<Value>[][];
    current: Field<Value>[];
    affect?: undefined;
}

export type Field<Value> = FieldBasic<Value> | FieldWithBundle<Value> | FieldWithUnion<Value>;

export const isFieldBasic = <T>(field: Field<T>): field is FieldBasic<T> =>
    field.type !== 'array' && field.type !== 'union';
