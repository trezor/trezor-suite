const primitiveTypes = [
    'bool',
    'string',
    'bytes',
    'int32',
    'int64',
    'uint32',
    'uint64',
    'sint32',
    'sint64',
    'fixed32',
    'fixed64',
    'sfixed32',
    'sfixed64',
    'double',
    'float',
];

/**
 * Determines whether given field is "primitive"
 * bool, strings, uint32 => true
 * HDNodeType => false
 */
export const isPrimitiveField = (field: any) => primitiveTypes.includes(field);
