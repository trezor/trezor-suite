import React from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { Card, Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { Textarea, Button, Icon, Tooltip } from '@trezor/components';
import { useActions, useAnalytics } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { isHexValid } from '@wallet-utils/validation';
import { Network } from '@wallet-types';
import { OpenGuideFromTooltip } from '@guide-views';

const Wrapper = styled.div`
    /* display: flex;
    padding: 6px 12px; */
`;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
    padding: 32px 42px;
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

const Raw = ({ network }: { network: Network }) => {
    const analytics = useAnalytics();
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
                            if (
                                !isHexValid(
                                    value,
                                    network.networkType === 'ethereum' ? '0x' : undefined,
                                )
                            )
                                return 'DATA_NOT_VALID_HEX';
                        },
                    })}
                    bottomText={<InputError error={error} />}
                    label={
                        <Tooltip
                            openGuide={{
                                node: <OpenGuideFromTooltip id="/suite-basics/send/send-raw.md" />,
                            }}
                            content={<Translation id="SEND_RAW_TRANSACTION_TOOLTIP" />}
                            dashed
                        >
                            <Translation id="SEND_RAW_TRANSACTION" />
                        </Tooltip>
                    }
                    labelRight={<Icon size={20} icon="CROSS" onClick={() => sendRaw(false)} />}
                />
            </StyledCard>
            <ButtonWrapper>
                <ButtonSend
                    isDisabled={inputState !== 'success'}
                    onClick={async () => {
                        const result = await pushRawTransaction(inputValue, network.symbol);
                        if (result) {
                            setValue(inputName, '');
                            analytics.report({
                                type: 'send-raw-transaction',
                                payload: {
                                    networkSymbol: network.symbol,
                                },
                            });
                        }
                    }}
                >
                    <Translation id="SEND_TRANSACTION" />
                </ButtonSend>
            </ButtonWrapper>
        </Wrapper>
    );
};

export default Raw;
