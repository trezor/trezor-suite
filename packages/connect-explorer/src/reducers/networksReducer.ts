import type { Reducer } from 'redux';

import type { NetworkConfigState } from '@trezor/network-module-types';

import type { MethodAction, TrezorConnectAction } from '../types/actions';

export const networksReducer: Reducer<
    NetworkConfigState['networks'],
    MethodAction | TrezorConnectAction
> = (state = null) => state;
