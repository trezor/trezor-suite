import { networks } from '@trezor/utxo-lib';

import {
    AddressController,
    CoinjoinAddressController,
} from '../../src/backend/CoinjoinAddressController';
import { SEGWIT_XPUB, SEGWIT_RECEIVE_ADDRESSES } from '../fixtures/methods.fixture';

const getAddress = ({ address }: { address: string }) => address;

const LOOKOUT = 3;
const INITIAL_COUNT = 2;

describe('CoinjoinAddressController', () => {
    let controller: AddressController;

    beforeEach(() => {
        controller = new CoinjoinAddressController(
            SEGWIT_XPUB,
            'receive',
            LOOKOUT,
            networks.regtest,
            INITIAL_COUNT,
        );
    });

    it('empty', () => {
        expect(controller.addresses.map(getAddress)).toStrictEqual(
            SEGWIT_RECEIVE_ADDRESSES.slice(0, INITIAL_COUNT),
        );
        controller.analyze(() => []);
        expect(controller.addresses.map(getAddress)).toStrictEqual(
            SEGWIT_RECEIVE_ADDRESSES.slice(0, INITIAL_COUNT),
        );
    });

    it('derive more', () => {
        controller.analyze(({ address }) =>
            address === SEGWIT_RECEIVE_ADDRESSES[1] ? [true] : [],
        );
        expect(controller.addresses.map(getAddress)).toStrictEqual(SEGWIT_RECEIVE_ADDRESSES);
    });

    it('collect txs', () => {
        const result: number[] = [];
        controller.analyze(
            ({ address }) => {
                const index = SEGWIT_RECEIVE_ADDRESSES.indexOf(address);
                return index % 2 === 0 ? [index] : [];
            },
            (txs: number[]) => result.push(...txs),
        );
        expect(controller.addresses.length).toBe(SEGWIT_RECEIVE_ADDRESSES.length + LOOKOUT);
        expect(result).toStrictEqual([0, 2, 4]);
    });
});
