import { useState } from 'react';

import { type Timer } from './Timer';

class NullTimer implements Timer {
    timeSpent = { seconds: 0 };
    resetCount = 0;
    isStopped = false;
    isLoading = false;
    stop() {}
    reset() {}
    loading() {}
}

/**
 * A no-op timer hook that does nothing but provides Timer instance.
 */
export const useNullTimer = (): Timer => {
    const [nullTimer] = useState(() => new NullTimer());

    return nullTimer;
};
