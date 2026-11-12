import { CARDANO } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import {
    getAddressType,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from './cardanoAddressParameters';

describe('cardano address parameters', () => {
    it('basic test', () => {
        expect(getProtocolMagic('ada')).toEqual(CARDANO.PROTOCOL_MAGICS.mainnet);

        expect(getDerivationType('normal')).toEqual(1);
        expect(getDerivationType('legacy')).toEqual(2);
        expect(getDerivationType('ledger')).toEqual(0);
        // TS does not allow this, but in runtime, the default case handles it
        expect(getDerivationType(undefined as any)).toEqual(1);

        expect(getNetworkId()).toEqual(CARDANO.NETWORK_IDS.mainnet);

        expect(getAddressType()).toEqual(PROTO.CardanoAddressType.BASE);

        expect(getStakingPath({ index: 1 })).toEqual(`m/1852'/1815'/1'/2/0`);
        expect(getStakingPath({ index: 12 })).toEqual(`m/1852'/1815'/12'/2/0`);
    });
});
