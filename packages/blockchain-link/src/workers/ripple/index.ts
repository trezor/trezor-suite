import { CONTEXT } from '../baseWorker';
import { RippleWorker } from './rippleWorker';

// export worker factory used in src/index
export default function Ripple() {
    return new RippleWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new RippleWorker();
    onmessage = module.messageHandler.bind(module);
}
