import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import * as fixtures from './__fixtures__/parseErc681TransferUri';
import { parseErc681TransferUri } from './parseErc681TransferUri';

const networkConfigDeps = mockNetworkConfigDeps();

describe(parseErc681TransferUri.name, () => {
    fixtures.parseErc681TransferUri.forEach(f => {
        it(f.description, () => {
            expect(parseErc681TransferUri(networkConfigDeps, f.uri)).toEqual(f.result);
        });
    });
});
