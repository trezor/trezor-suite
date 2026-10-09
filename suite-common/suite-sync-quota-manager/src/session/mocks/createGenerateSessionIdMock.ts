import { mock } from '@trezor/dependency-injection';

import { type GenerateSessionId } from '../generateSessionId';

export const createGenerateSessionIdMock = (sessionIds: string[]) => {
    const impl = mock<GenerateSessionId>();
    sessionIds.forEach(sessionId => impl.mockReturnValueOnce(sessionId));

    return impl;
};
