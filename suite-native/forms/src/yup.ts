import * as yup from 'yup';

// Placeholder copy for the messages yup emits for bare `.required()` / `.max()` calls.
// Should be later replaced by an implementation of a localization module.
yup.setLocale({
    string: {
        max: 'Number of characters exceeded',
    },
    mixed: {
        required: 'Field is mandatory',
    },
});

export { yup };
