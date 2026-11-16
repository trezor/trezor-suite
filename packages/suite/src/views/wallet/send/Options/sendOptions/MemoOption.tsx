import type { TransactionMemo } from '@trezor/network-module-suite-common-types';

import { OptionalMemo } from './OptionalMemo';
import { sendOptionFields } from './sendFormFields';
import { useSendOption } from './useSendOption';

type MemoOptionProps = {
    memo: TransactionMemo;
};

/** A memo the sender added from the menu, for networks where the receiver doesn't need one. */
export const MemoOption = ({ memo }: MemoOptionProps) => {
    const { isEnabled, toggle } = useSendOption(sendOptionFields.memo.option);

    return isEnabled ? <OptionalMemo memo={memo} close={toggle} /> : null;
};
