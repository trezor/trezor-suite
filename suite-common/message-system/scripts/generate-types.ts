import * as fs from 'fs';
import * as json2ts from 'json-schema-to-typescript';

import { SCHEMA_PATH, TYPES_PATH } from './constants';

const options = {
    style: { singleQuote: true, tabWidth: 4 },
    ignoreMinAndMaxItems: true,
    bannerComment: `/**
            * DO NOT MODIFY BY HAND! This file was automatically generated.
            * Instead, modify the original JSONSchema file in /message-system/schema, and run yarn build:libs.
            */`,
};

json2ts.compileFromFile(SCHEMA_PATH, options).then(types => {
    fs.writeFileSync(TYPES_PATH, types);
});
