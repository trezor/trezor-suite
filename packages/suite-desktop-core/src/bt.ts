import { init } from './modules/bluetooth';

// quick test for ts-node
const run = async () => {
    const bt = init({ minWindow: undefined } as any);
    if (bt) {
        await bt(1);
    }
};

run();
