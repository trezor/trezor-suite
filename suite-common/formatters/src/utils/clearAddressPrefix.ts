// Removes mandatory BCH prefix for cashaddr format for display in the chunked view.
export const clearAddressPrefix = (value: string) => value.replace(/^bitcoincash:/i, '');
