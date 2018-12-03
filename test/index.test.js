import fs from 'fs';

import TrezorUpdate from 'index';
import { T1 } from './__utils__';

const models = {
    1: {
        firmwareList: JSON
            .parse(fs.readFileSync('test/__data__/releases1.json', 'utf-8')),
    },
    2: {
        firmwareList: JSON
            .parse(fs.readFileSync('test/__data__/releases2.json', 'utf-8')),
    },
};

const trezorUpdate = new TrezorUpdate({
    firmwareList1: models[1].firmwareList,
    firmwareList2: models[2].firmwareList,
});

describe('getLatestSafeFw()', () => {
    it('should not return latest fw if it has bootloader version higher than bl version of device', () => {
        const t1 = new T1({ fwVersion: '1.6.3' }); // this is not latest
        const update = trezorUpdate.getLatestSafeFw(t1.features);
        console.log(update);
    });
});
