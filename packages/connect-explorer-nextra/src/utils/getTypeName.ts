import { Hint, Kind, TSchema } from '@sinclair/typebox';

export const getTypeName = (value: TSchema, hasDescendants?: boolean) => {
    let typeName = value[Kind];
    if (value[Kind] === 'Array') {
        const childTypeName = getTypeName(value.items);
        typeName = childTypeName ? `Array<${childTypeName}>` : 'Array';
    } else if (value[Kind] === 'Literal') {
        if (typeof value.const === 'number') {
            typeName = value.const.toString();
        } else {
            typeName = JSON.stringify(value.const);
        }
        if (value.$id) {
            typeName = value.$id + ' (' + typeName + ')';
        }
    } else if (value[Kind] === 'Union' && !hasDescendants) {
        const itemsFiltered = value.anyOf?.filter((v: TSchema, i: number) => {
            // Filter enum non-numbers
            if (value[Hint] === 'Enum' && v[Kind] === 'Literal' && typeof v.const === 'string') {
                return false;
            }
            // Filter union number indexes - unnecessary to display
            if (v[Kind] === 'Literal' && (v.const === i || v.const === i.toString())) {
                return false;
            }

            return true;
        });
        if (itemsFiltered.length > 0) {
            typeName = itemsFiltered?.map((v: TSchema) => getTypeName(v)).join(' | ');
        }
        if (value[Hint] === 'Enum') {
            typeName = 'Enum: ' + typeName;
        }
    } else if (value[Kind] === 'Intersect' && !hasDescendants) {
        typeName = value.anyOf?.map((v: TSchema) => getTypeName(v)).join(' & ');
    } else if (value[Kind] === 'Object' && value.$id) {
        typeName = value.$id;
    }

    return typeName;
};
