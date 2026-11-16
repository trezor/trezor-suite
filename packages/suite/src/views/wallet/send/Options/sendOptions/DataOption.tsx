import { useEffect } from 'react';

import type {
    TransactionData as Data,
    SendTransfer,
} from '@trezor/network-module-suite-common-types';

import { useSendFormContext } from '#src/hooks/wallet';

import { sendOptionFields } from './sendFormFields';
import { useSendOption } from './useSendOption';
import { TransactionData } from '../TransactionData';

type DataOptionProps = {
    data: Data;
    transfer: SendTransfer;
};

/** Call data, closed again as soon as the network no longer allows it, such as for a token. */
export const DataOption = ({ data, transfer }: DataOptionProps) => {
    const { toggleOption, resetDefaultValue } = useSendFormContext();
    const { isEnabled, toggle } = useSendOption(sendOptionFields.data.option);
    const isAllowed = data.isAllowed(transfer);

    useEffect(() => {
        if (!isAllowed && isEnabled) {
            toggleOption(sendOptionFields.data.option);
            resetDefaultValue(sendOptionFields.data.value);
        }
    }, [isAllowed, isEnabled, toggleOption, resetDefaultValue]);

    return isAllowed && isEnabled ? (
        <TransactionData maxBytes={data.maxBytes} close={toggle} />
    ) : null;
};
