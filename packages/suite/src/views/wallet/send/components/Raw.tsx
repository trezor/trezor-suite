import React from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Card, Translation } from 'src/components/suite';
import { InputError } from 'src/components/wallet';
import { Textarea, Button, Icon, Tooltip, variables } from '@trezor/components';
import { useActions } from 'src/hooks/suite';
import * as sendFormActions from 'src/actions/wallet/sendFormActions';
import { getInputState, isHexValid } from '@suite-common/wallet-utils';
import { Network } from 'src/types/wallet';
import { OpenGuideFromTooltip } from 'src/components/guide';

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

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 32px 20px;
    }
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
    const {
        register,
        getValues,
        setValue,
        formState: { errors },
    } = useForm({
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
                    inputState={inputState}
                    isMonospace
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
                            guideAnchor={instance => (
                                <OpenGuideFromTooltip
                                    id="/3_send-and-receive/transactions-in-depth/send-raw.md"
                                    instance={instance}
                                />
                            )}
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
                                type: EventType.SendRawTransaction,
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
