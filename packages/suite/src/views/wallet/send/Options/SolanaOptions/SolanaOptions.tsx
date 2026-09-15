import { useSendFormContext } from 'src/hooks/wallet';

import { SolanaMemo } from './SolanaMemo';

export const SolanaOptions = () => {
    // React Compiler: `getDefaultValue` reads the form imperatively, so a compiled render-time read
    // of it freezes as soon as its own identity is stable. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const memoEnabled = options.includes('destinationTag');

    const toggleMemo = () => {
        toggleOption('destinationTag');
        composeTransaction();
    };

    return <>{memoEnabled && <SolanaMemo close={toggleMemo} />}</>;
};
