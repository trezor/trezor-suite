import { useMemo, useState } from 'react';

import { ImportTransactionModal } from '@trezor/suite/src/components/suite/modals/ReduxModal/UserContextModal/ImportTransactionModal/ImportTransactionModal';
import { createDeferred } from '@trezor/utils';

import { MockStoreStory } from '../gallery/storyProviders';

/**
 * The modal resolves a deferred with the parsed rows and closes itself, so the story owns the
 * deferred and records what it received into a hidden input for the test to read.
 */
export const CsvImport = () => {
    const [parsedOutputs, setParsedOutputs] = useState<Record<string, string>[] | null>(null);

    const decision = useMemo(() => {
        const deferred = createDeferred<Record<string, string>[]>();
        deferred.promise.then(setParsedOutputs).catch(() => {});

        return deferred;
    }, []);

    return (
        <MockStoreStory>
            <ImportTransactionModal onCancel={() => {}} decision={decision} />
            <form hidden>
                <input
                    data-testid="parsed-outputs"
                    readOnly
                    value={parsedOutputs ? JSON.stringify(parsedOutputs) : ''}
                />
            </form>
        </MockStoreStory>
    );
};
