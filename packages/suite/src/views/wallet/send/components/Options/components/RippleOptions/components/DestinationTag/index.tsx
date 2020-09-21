import React from 'react';
import BigNumber from 'bignumber.js';
import { Input, Icon } from '@trezor/components';
import { QuestionTooltip } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { isInteger } from '@wallet-utils/validation';
import { U_INT_32 } from '@wallet-constants/sendForm';
import { MAX_LENGTH } from '@suite-constants/inputs';

interface Props {
    close: () => void;
}

const DestinationTag = ({ close }: Props) => {
    const { register, getDefaultValue, errors, composeTransaction } = useSendFormContext();

    const inputName = 'rippleDestinationTag';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];

    return (
        <Input
            state={getInputState(error, inputValue)}
            monospace
            name={inputName}
            data-test={inputName}
            defaultValue={inputValue}
            maxLength={MAX_LENGTH.XRP_DESTINATION_TAG}
            innerRef={register({
                required: 'DESTINATION_TAG_NOT_SET',
                validate: (value: string) => {
                    const amountBig = new BigNumber(value);
                    if (amountBig.isNaN()) {
                        return 'DESTINATION_TAG_IS_NOT_NUMBER';
                    }
                    if (!isInteger(value) || amountBig.lt(0) || amountBig.gt(U_INT_32)) {
                        return 'DESTINATION_TAG_IS_NOT_VALID';
                    }
                },
            })}
            onChange={() => {
                composeTransaction(inputName);
            }}
            label={<QuestionTooltip label="DESTINATION_TAG" tooltip="DESTINATION_TAG_EXPLAINED" />}
            labelRight={<Icon size={20} icon="CROSS" usePointerCursor onClick={close} />}
            bottomText={<InputError error={error} />}
        />
    );
};

export default DestinationTag;
