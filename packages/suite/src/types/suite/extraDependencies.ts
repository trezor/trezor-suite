import { ExtraDependencies } from '@suite-common/redux-utils';

import type { BioAuthState } from 'src/reducers/bioAuth';

// Extend the ExtraDependencies type to include our custom reducers
export interface SuiteExtraDependencies extends ExtraDependencies {
    reducers: ExtraDependencies['reducers'] & {
        storageLoadBioAuth: (
            state: BioAuthState,
            action: { type: any; payload: any },
        ) => BioAuthState;
    };
}
