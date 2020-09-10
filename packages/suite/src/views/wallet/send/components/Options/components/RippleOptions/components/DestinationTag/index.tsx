import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Input, Icon } from '@trezor/components';
import { U_INT_32 } from '@wallet-constants/sendForm';
import { Translation, QuestionTooltip } from '@suite-components';
import { InputError } from '@wallet-components';
import { MAX_LENGTH } from '@suite-constants/inputs';

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    close: () => void;
}

export default ({ close }: Props) => {
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
                    if (!amountBig.isInteger() || amountBig.lt(0) || amountBig.gt(U_INT_32)) {
                        return 'DESTINATION_TAG_IS_NOT_VALID';
                    }
                },
            })}
            onChange={() => {
                composeTransaction(inputName, !!error);
            }}
            label={
                <Label>
                    <Text>
                        <Translation id="DESTINATION_TAG" />
                    </Text>
                    <QuestionTooltip messageId="DESTINATION_TAG_EXPLAINED" />
                </Label>
            }
            labelRight={<StyledIcon size={20} icon="CROSS" onClick={close} />}
            bottomText={<InputError error={error} />}
        />
    );
};
