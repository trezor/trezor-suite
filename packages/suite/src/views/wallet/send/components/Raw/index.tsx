import React from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { Card, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { Textarea, Button, Icon } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { getInputState } from '@wallet-utils/sendFormUtils';

const Wrapper = styled.div`
    /* display: flex;
    padding: 6px 12px; */
`;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    display: flex;
    padding: 6px 12px;
    justify-content: flex-end;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const ButtonWrapper = styled.div`
    display: flex;
    margin: 25px 0;
    justify-content: center;
`;

const ButtonSend = styled(Button)`
    min-width: 200px;
    margin-bottom: 5px;
`;

export default () => {
    const { register, getValues, setValue, errors } = useForm({
        mode: 'onChange',
        defaultValues: {
            rawTx: '',
        },
    });

    const { sendRaw, pushRawTransaction } = useActions({
        sendRaw: sendFormActions.sendRaw,
        pushRawTransaction: sendFormActions.pushRawTransaction,
    });

    const inputName = 'rawTx';
    const inputValue = getValues(inputName) || '';
    const error = errors[inputName];
    const inputState = getInputState(error, inputValue);

    return (
        <Wrapper>
            <IconWrapper>
                <StyledIcon size={20} icon="CROSS" onClick={() => sendRaw(false)} />
            </IconWrapper>
            <StyledCard>
                <Textarea
                    state={inputState}
                    monospace
                    name={inputName}
                    data-test={inputName}
                    defaultValue={inputValue}
                    innerRef={register({
                        required: 'RAW_TX_NOT_SET',
                        validate: (value: string) => {
                            if (value.length % 2 !== 0) return 'DATA_NOT_VALID_HEX';
                        },
                    })}
                    bottomText={<InputError error={error} />}
                    label={
                        <Label>
                            <Translation id="SEND_RAW_TRANSACTION" />
                        </Label>
                    }
                />
            </StyledCard>
            <ButtonWrapper>
                <ButtonSend
                    isDisabled={inputState !== 'success'}
                    onClick={async () => {
                        const result = await pushRawTransaction(inputValue);
                        if (result) {
                            setValue(inputName, '');
                        }
                    }}
                >
                    <Translation id="SEND_TRANSACTION" />
                </ButtonSend>
            </ButtonWrapper>
        </Wrapper>
    );
};
