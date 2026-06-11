export const decimalTransformer = (value: string) =>
    value
        .replace(/,/g, '.') // accept both ',' and '.' as decimal separators
        .replace(/[^\d.]/g, '') // remove all non-numeric characters
        .replace(/^\./, '0.') // prefix a leading '.' with '0' (e.g. '.5' -> '0.5')
        .replace(/(?<=\..*)\./g, '') // keep only first appearance of the '.' symbol
        .replace(/^0+(?=\d)/g, ''); // remove leading zeros when followed by another digit

export const integerTransformer = (value: string) =>
    value
        .replace(/\D/g, '') // remove all non-digit characters
        .replace(/^0+(?=\d)/g, ''); // remove leading zeros when followed by another digit
