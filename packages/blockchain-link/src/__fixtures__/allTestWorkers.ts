import Blockbook from '../workers/blockbook/blockbookWorker';
import Blockfrost from '../workers/blockfrost/blockfrostWorker';
import Ripple from '../workers/ripple/rippleWorker';

export const allTestWorkers = [
    { name: 'blockbook', worker: Blockbook },
    { name: 'ripple', worker: Ripple },
    { name: 'blockfrost', worker: Blockfrost },
] as const;
