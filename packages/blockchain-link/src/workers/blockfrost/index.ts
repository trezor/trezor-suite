import { CONTEXT } from '../baseWorker';
import { BlockfrostWorker } from './blockfrostWorker';

// export worker factory used in src/index
export default function Blockfrost() {
    return new BlockfrostWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new BlockfrostWorker();
    onmessage = module.messageHandler.bind(module);
}
