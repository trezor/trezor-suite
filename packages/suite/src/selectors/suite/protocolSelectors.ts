import type { ProtocolState } from '../../reducers/suite/protocolReducer';

type ProtocolRootState = {
    protocol: ProtocolState;
};

export const selectProtocol = (state: ProtocolRootState) => state.protocol;

export const selectProtocolSendFormScheme = (state: ProtocolRootState) =>
    state.protocol.sendForm.scheme;
