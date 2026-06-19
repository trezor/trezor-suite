import { useSendFormContext } from 'src/hooks/wallet';

import { SolanaMemo } from './SolanaMemo';

export const SolanaOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const memoEnabled = options.includes('destinationTag');

    const toggleMemo = () => {
        toggleOption('destinationTag');
        composeTransaction();
    };

    return <>{memoEnabled && <SolanaMemo close={toggleMemo} />}</>;
};
