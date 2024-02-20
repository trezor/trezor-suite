import { networks } from '@trezor/utxo-lib';

import { CoinjoinAddressController } from '../../src/backend/CoinjoinAddressController';
import {
    SEGWIT_XPUB,
    SEGWIT_RECEIVE_ADDRESSES,
    SEGWIT_CHANGE_ADDRESSES,
} from '../fixtures/methods.fixture';

const getAddress = ({ address }: { address: string }) => address;

const LOOKOUT = 3;
const INITIAL_COUNT = 2;

describe('CoinjoinAddressController', () => {
    let controller: CoinjoinAddressController;

    beforeEach(() => {
        controller = new CoinjoinAddressController(
            SEGWIT_XPUB,
            networks.regtest,
            {
                receiveCount: INITIAL_COUNT,
                changeCount: INITIAL_COUNT,
                blockHeight: NaN,
                blockHash: '',
            },
            undefined,
            { receiveLookout: LOOKOUT, changeLookout: LOOKOUT },
        );
    });

    it('empty', () => {
        expect(controller.receive.map(getAddress)).toStrictEqual(
            SEGWIT_RECEIVE_ADDRESSES.slice(0, INITIAL_COUNT),
        );
        expect(controller.change.map(getAddress)).toStrictEqual(
            SEGWIT_CHANGE_ADDRESSES.slice(0, INITIAL_COUNT),
        );
        expect(controller.analyze(() => [])).toStrictEqual({ receive: [], change: [] });
    });

    it('derive more receive', () => {
        const { receive, change } = controller.analyze(({ address }) =>
            address === SEGWIT_RECEIVE_ADDRESSES[1] ? [true] : [],
        );
        expect(receive.map(getAddress)).toStrictEqual(
            SEGWIT_RECEIVE_ADDRESSES.slice(INITIAL_COUNT),
        );
        expect(change).toStrictEqual([]);
        expect(controller.receive.map(getAddress)).toStrictEqual(SEGWIT_RECEIVE_ADDRESSES);
    });

    it('derive more change', () => {
        const { receive, change } = controller.analyze(({ address }) =>
            address === SEGWIT_CHANGE_ADDRESSES[1] ? [true] : [],
        );
        expect(receive).toStrictEqual([]);
        expect(change.map(getAddress)).toStrictEqual(SEGWIT_CHANGE_ADDRESSES.slice(INITIAL_COUNT));
        expect(controller.change.map(getAddress)).toStrictEqual(SEGWIT_CHANGE_ADDRESSES);
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
        expect(controller.receive.length).toBe(SEGWIT_RECEIVE_ADDRESSES.length + LOOKOUT);
        expect(controller.change.length).toBe(INITIAL_COUNT);
        expect(result).toStrictEqual([0, 2, 4]);
    });
});
