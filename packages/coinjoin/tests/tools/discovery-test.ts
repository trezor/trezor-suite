/* eslint-disable no-console */

import { getAccountInfo, getAccountInfoParams } from './discovery';

const [network, descriptor] = process.argv.slice(2);
const params = getAccountInfoParams(network, descriptor);

(async () => {
    console.log('✅', 'Start');

    const accountInfo = await getAccountInfo(params);

    console.log('✅', 'End, printing account info:');
    console.log(JSON.stringify(accountInfo, null, 4));
})();
