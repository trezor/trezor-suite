import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';

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

    return (
        <>
            {!memoEnabled && (
                <Button intent="neutral" priority="secondary" iconLeft="tag" onClick={toggleMemo}>
                    <Translation id="MEMO_SWITCH" />
                </Button>
            )}

            {memoEnabled && <SolanaMemo close={toggleMemo} />}
        </>
    );
};
