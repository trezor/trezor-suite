import { SendOutputFieldName } from './sendOutputsFormSchema';

export const sendAmountTransformer = (value: string) =>
    value
        .replace(/[^0-9\.]/g, '') // remove all non-numeric characters
        .replace(/^\./g, '') // remove '.' symbol if it is not preceded by number
        .replace(/(?<=\..*)\./g, '') // keep only first appearance of the '.' symbol
        .replace(/(?<=^0+)0/g, ''); // remove all leading zeros except the first one

export const getOutputFieldName = <TField extends SendOutputFieldName>(
    index: number,
    field: TField,
): `outputs.${number}.${TField}` => `outputs.${index}.${field}`;
