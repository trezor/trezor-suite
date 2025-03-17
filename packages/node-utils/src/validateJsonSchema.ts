import Ajv from 'ajv';

// checks that a config meets the criteria specified by the schema
export const validateJsonSchema = (config: string, schema: string) => {
    const ajv = new Ajv();

    let parsedConfig;
    let parsedSchema;

    try {
        parsedConfig = JSON.parse(config);
    } catch (err) {
        throw Error(`Invalid config JSON format: ${err.message}`);
    }

    try {
        parsedSchema = JSON.parse(schema);
    } catch (err) {
        throw Error(`Invalid schema JSON format: ${err.message}`);
    }

    const validate = ajv.compile(parsedSchema);
    const isValid = validate(parsedConfig);

    if (!isValid) {
        throw Error(`Config is invalid: ${JSON.stringify(validate.errors)}`);
    }
};
