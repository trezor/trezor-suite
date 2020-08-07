import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Input, Icon } from '@trezor/components';
import { U_INT_32 } from '@wallet-constants/sendForm';
import { Translation, QuestionTooltip } from '@suite-components';

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
    setIsActive: (isActive: boolean) => void;
}

export default ({ setIsActive }: Props) => {
    const { register, getValues, errors, composeTransaction } = useSendFormContext();
    const inputName = 'rippleDestinationTag';
    const inputValue = getValues(inputName) || '';
    const error = errors[inputName];

    return (
        <Input
            state={getInputState(error, inputValue)}
            label={
                <Label>
                    <Text>
                        <Translation id="TR_XRP_DESTINATION_TAG" />
                    </Text>
                    <QuestionTooltip messageId="TR_XRP_DESTINATION_TAG_EXPLAINED" />
                </Label>
            }
            bottomText={error && error.message}
            name={inputName}
            data-test={inputName}
            defaultValue={inputValue}
            labelRight={<StyledIcon size={20} icon="CROSS" onClick={() => setIsActive(false)} />}
            innerRef={register({
                required: 'TR_DESTINATION_TAG_IS_NOT_SET',
                validate: (value: string) => {
                    const amountBig = new BigNumber(value);
                    if (amountBig.isNaN()) {
                        return 'TR_LOCKTIME_IS_NOT_NUMBER';
                    }
                    if (!amountBig.isInteger() || amountBig.lt(0) || amountBig.gt(U_INT_32)) {
                        return 'TR_DESTINATION_TAG_IS_NOT_VALID';
                    }
                },
            })}
            onChange={() => {
                composeTransaction(inputName, !!error);
            }}
        />
    );
};
