import Blockbook from '../../../src/workers/blockbook';
import Blockfrost from '../../../src/workers/blockfrost';
import Ripple from '../../../src/workers/ripple';

export default [
    { name: 'blockbook', worker: Blockbook },
    { name: 'ripple', worker: Ripple },
    { name: 'blockfrost', worker: Blockfrost },
] as const;
