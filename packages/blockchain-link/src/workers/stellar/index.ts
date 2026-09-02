import { CONTEXT } from '../baseWorker';
import { StellarWorker } from './stellarWorker';

// export worker factory used in src/index
export default function Stellar() {
    return new StellarWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new StellarWorker();
    onmessage = module.messageHandler.bind(module);
}
