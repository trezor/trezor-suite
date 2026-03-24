import { type MODAL_CONTEXT_NONE } from '@suite/modal';

import type { AppState } from 'src/types/suite';

export type ReduxModalProps<
    T extends AppState['modal']['context'] = Exclude<
        AppState['modal']['context'],
        typeof MODAL_CONTEXT_NONE
    >,
> = Extract<AppState['modal'], { context: T }>;
