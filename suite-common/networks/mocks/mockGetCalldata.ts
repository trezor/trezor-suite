import { mock } from '@trezor/dependency-injection';
import { getEthereumCalldata } from '@trezor/network-ethereum-suite-common';
import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import { getTronCalldata } from '@trezor/network-tron-suite-common';
import { supportedTronNetworks } from '@trezor/network-tron-types';

import { type GetCalldata } from '../src/createGetCalldata';

export const mockGetCalldata = () =>
    mock<GetCalldata>(symbol => {
        if (supportedEthereumNetworks.some(supported => supported === symbol)) {
            return getEthereumCalldata();
        }

        if (supportedTronNetworks.some(supported => supported === symbol)) {
            return getTronCalldata();
        }

        return undefined;
    });
