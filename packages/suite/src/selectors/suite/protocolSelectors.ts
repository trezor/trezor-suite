import type { ProtocolState } from '#src/reducers/suite/protocolState';

type ProtocolRootState = {
    protocol: ProtocolState;
};

export const selectProtocol = (state: ProtocolRootState) => state.protocol;

export const selectProtocolSendFormScheme = (state: ProtocolRootState) =>
    state.protocol.sendForm.scheme;
