import * as fs from 'fs';
import { join } from 'path';
import * as json2ts from 'json-schema-to-typescript';

import { PACKAGES_ROOT, SCHEMA_PATH, SUITE_TYPES_FILENAME } from '../constants';

const suiteTypesPath = join(PACKAGES_ROOT, 'suite', 'src', 'types', 'suite', SUITE_TYPES_FILENAME);

const options = {
    style: { singleQuote: true, tabWidth: 4 },
    ignoreMinAndMaxItems: true,
    bannerComment: `/**
            * DO NOT MODIFY BY HAND! This file was automatically generated.
            * Instead, modify the original JSONSchema file in suite-data/src/message-system/schema, and run yarn build:libs.
            */`,
};

json2ts.compileFromFile(SCHEMA_PATH, options).then(types => {
    fs.writeFileSync(suiteTypesPath, types);
});
