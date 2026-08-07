import * as fixtures from './__fixtures__/parseErc681TransferUri';
import { parseErc681TransferUri } from './parseErc681TransferUri';

describe(parseErc681TransferUri.name, () => {
    fixtures.parseErc681TransferUri.forEach(f => {
        it(f.description, () => {
            expect(parseErc681TransferUri(mockNetworkConfigDeps, f.uri)).toEqual(f.result);
        });
    });
});
import { mockNetworkConfigDeps } from '@suite-common/wallet-config/mocks';
