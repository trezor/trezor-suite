/* eslint-disable no-console */
import * as fs from 'fs';
import Ajv from 'ajv';

import { CONFIG_PATH, SCHEMA_PATH } from './constants';

// checks that a config meets the criteria specified by the schema
const validateConfigStructure = () => {
    console.log('Validating config against schema...');

    const ajv = new Ajv();

    const config = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

    const validate = ajv.compile(JSON.parse(schema));
    const isValid = validate(JSON.parse(config));

    if (!isValid) {
        throw Error(`Config is invalid: ${JSON.stringify(validate.errors)}`);
    }

    console.log('Config is valid!');
};

validateConfigStructure();
