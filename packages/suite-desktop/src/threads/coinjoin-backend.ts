import { CoinjoinBackend, CoinjoinBackendSettings } from '@trezor/coinjoin';

import { createThread } from '../libs/thread';

const init = (settings: CoinjoinBackendSettings) => new CoinjoinBackend(settings);

createThread(init);
