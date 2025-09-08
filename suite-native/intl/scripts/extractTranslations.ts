import fs from 'fs';

import { messages } from '../src/messages';
import { flatten } from '../src/utils';

const flatMessages = flatten(messages);
const jsonString = JSON.stringify(flatMessages, null, 4);

fs.writeFileSync('translations/master.json', jsonString);
