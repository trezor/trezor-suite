import { ProtocolParams } from '../src/types/types';
import { DEFAULT_PROTOCOL_PARAMS } from '../src/utils/protocolParams';

export const mockProtocolParams = (overrides: Partial<ProtocolParams> = {}): ProtocolParams => ({
    ...DEFAULT_PROTOCOL_PARAMS,
    ...overrides,
});
