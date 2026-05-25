/* eslint-disable no-console */

import { getAccountInfo, getAccountInfoParams } from './discovery';

const argvSlice = process.argv.slice(2);
const network = argvSlice[0] ?? '';
const descriptor = argvSlice[1] ?? '';
const params = getAccountInfoParams(network, descriptor);

(async () => {
    console.log('✅', 'Start');

    const accountInfo = await getAccountInfo(params);

    console.log('✅', 'End, printing account info:');
    console.log(JSON.stringify(accountInfo, null, 4));
})();
