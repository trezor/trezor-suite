import { CONTEXT } from '../baseWorker';
import { BlockbookWorker } from './blockbookWorker';

// export worker factory used in src/index
export default function Blockbook() {
    return new BlockbookWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new BlockbookWorker();
    onmessage = module.messageHandler.bind(module);
}
