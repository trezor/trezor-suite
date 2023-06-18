import React from 'react';
import BigNumber from 'bignumber.js';
import { Input, Icon } from '@trezor/components';
import { QuestionTooltip } from 'src/components/suite';
import { InputError } from 'src/components/wallet';
import { useSendFormContext } from 'src/hooks/wallet';
import { getInputState, isInteger } from '@suite-common/wallet-utils';
import { U_INT_32 } from '@suite-common/wallet-constants';
import { MAX_LENGTH } from 'src/constants/suite/inputs';

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
            inputState={getInputState(error, inputValue)}
            isMonospace
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
            labelRight={<Icon size={20} icon="CROSS" useCursorPointer onClick={close} />}
            bottomText={<InputError error={error} />}
        />
    );
};

export default DestinationTag;
