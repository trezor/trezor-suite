import type { Reducer } from 'redux';

import type { NetworkConfigs } from '@trezor/network-module-types';

export const networksReducer: Reducer<NetworkConfigs> = (state = null) => state;
