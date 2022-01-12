import Blockbook from '../../../src/workers/blockbook';
import Ripple from '../../../src/workers/ripple';
import Blockfrost from '../../../src/workers/blockfrost';

export default [
    { name: 'blockbook', worker: Blockbook },
    { name: 'ripple', worker: Ripple },
    { name: 'blockfrost', worker: Blockfrost },
] as const;
