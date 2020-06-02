import validator from 'validator';

export const validateAddress = (address: string, networkType) => {
    if (validator.isEmpty(address)) {
        output.address.error = VALIDATION_ERRORS.IS_EMPTY;
        return draft;
    }
};
