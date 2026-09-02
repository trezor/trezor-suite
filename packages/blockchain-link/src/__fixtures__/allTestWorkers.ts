import Blockbook from '../workers/blockbook';
import Blockfrost from '../workers/blockfrost';
import Ripple from '../workers/ripple';

export const allTestWorkers = [
    { name: 'blockbook', worker: Blockbook },
    { name: 'ripple', worker: Ripple },
    { name: 'blockfrost', worker: Blockfrost },
] as const;
