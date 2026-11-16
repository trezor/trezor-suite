import { useSendFormContext } from '#src/hooks/wallet';

import { sendOptionFields } from './sendFormFields';
import { useSendOption } from './useSendOption';
import { Locktime } from '../Locktime/Locktime';

/** A locktime; a transaction that can't be mined yet is signed without broadcasting. */
export const LocktimeOption = () => {
    const { resetDefaultValue, toggleOption } = useSendFormContext();
    const { isEnabled, toggle } = useSendOption(sendOptionFields.locktime.option);
    const broadcast = useSendOption(sendOptionFields.broadcast.option);

    const close = () => {
        resetDefaultValue('bitcoinLocktimeBlockHeight');
        resetDefaultValue('bitcoinLocktimeDatetime');
        if (!broadcast.isEnabled) toggleOption(sendOptionFields.broadcast.option);
        toggle();
    };

    return isEnabled ? <Locktime close={close} /> : null;
};
