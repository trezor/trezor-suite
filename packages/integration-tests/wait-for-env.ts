/* eslint-disable no-await-in-loop,no-async-promise-executor */

import fetch from 'cross-fetch';
import { Controller } from './websocket-client';

const controller = new Controller();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// todo: move this type into websocket-client.js once it will be turned into ts
type FirmwaresEvent = {
    '1': string[];
    '2': string[];
    R: string[];
};

const filterFirmwares = (firmwares: FirmwaresEvent) => {
    const firmwareArg = process.env.TESTS_FIRMWARE;
    const latest2 = firmwares['2'].find(fw => !fw.includes('-'));
    const latest1 = firmwares['1'].find(fw => !fw.includes('-'));

    if (!latest2 || !latest1) {
        // should never happen
        throw new Error('could not translate n-latest into specific firmware version');
    }

    if (firmwareArg === '2-latest') {
        return latest2;
    }
    if (firmwareArg === '1-latest') {
        return latest1;
    }

    return firmwareArg || latest2;
};

const writeOut = (data: string) => {
    process.stdout.write(data);
};

const wait = async () => {
    try {
        await new Promise<void>(async resolve => {
            const limit = 90;
            let error = '';
            process.stderr.write('waiting for trezor-user-env');

            for (let i = 0; i < limit; i++) {
                if (i === limit - 1) {
                    process.stderr.write(`cant connect to trezor-user-env: ${error}\n`);
                }
                await delay(1000);

                try {
                    const res = await fetch('http://localhost:9002');
                    if (res.status === 200) {
                        break;
                    }
                } catch (err) {
                    error = err.message;
                    process.stderr.write('.');
                }
            }

            resolve();
        });

        process.stderr.write('\ntrezor-user-env: ready');

        const res = await controller.connect();
        const firmware = filterFirmwares(res);
        // translate 'n-latest' into specific fw number
        if (process.env.TESTS_FIRMWARE !== firmware) {
            writeOut(firmware);
        } else {
            writeOut(process.env.TESTS_FIRMWARE);
        }
    } catch (err) {
        process.stderr.write(JSON.stringify(err));
        process.exit(1);
    }
    process.exit(0);
};

// consume all unexpected outputs so that they do not go to stdout
Object.keys(console).forEach(k => {
    // @ts-ignore
    if (typeof console[k] === 'function') {
        // @ts-ignore
        console[k] = () => {};
    }
});

wait();
