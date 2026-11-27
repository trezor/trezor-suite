import { type NetworksRootState, selectNetworkSymbolForProtocol } from '@suite-common/networks';

import type { ProtocolState } from '#src/reducers/suite/protocolState';

type ProtocolRootState = {
    protocol: ProtocolState;
};

export const selectProtocol = (state: ProtocolRootState) => state.protocol;

export const selectProtocolSendFormScheme = (state: ProtocolRootState) =>
    state.protocol.sendForm.scheme;

export const selectProtocolSendFormNetworkSymbol = (state: ProtocolRootState & NetworksRootState) =>
    selectNetworkSymbolForProtocol(state, selectProtocolSendFormScheme(state));
