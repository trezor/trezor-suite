import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Card, Translation } from 'src/components/suite';
import { Textarea, Button, Icon, Tooltip, variables } from '@trezor/components';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { pushRawTransaction, sendRaw } from 'src/actions/wallet/sendFormActions';
import { getInputState, isHexValid } from '@suite-common/wallet-utils';
import { Network } from 'src/types/wallet';
import { OpenGuideFromTooltip } from 'src/components/guide';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    place-items: center space-between;
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

interface RawProps {
    network: Network;
}

const Raw = ({ network }: RawProps) => {
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
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const inputName = 'rawTx';
    const inputValue = getValues(inputName) || '';
    const error = errors[inputName];
    const inputState = getInputState(error, inputValue);
    const prefix = network.networkType === 'ethereum' ? '0x' : undefined;
    const { ref: inputRef, ...inputField } = register(inputName, {
        required: translationString('RAW_TX_NOT_SET'),
        validate: (value: string) => {
            if (!isHexValid(value, prefix)) return translationString('DATA_NOT_VALID_HEX');
        },
    });

    const cancel = () => dispatch(sendRaw(false));
    const send = async () => {
        const result = await dispatch(pushRawTransaction(inputValue, network.symbol));
        if (result) {
            setValue(inputName, '');
            analytics.report({
                type: EventType.SendRawTransaction,
                payload: {
                    networkSymbol: network.symbol,
                },
            });
        }
    };

    return (
        <>
            <StyledCard>
                <Textarea
                    inputState={inputState}
                    isMonospace
                    data-test={inputName}
                    defaultValue={inputValue}
                    bottomText={error?.message}
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
                    labelRight={<Icon size={20} icon="CROSS" onClick={cancel} />}
                    innerRef={inputRef}
                    {...inputField}
                />
            </StyledCard>
            <ButtonWrapper>
                <ButtonSend isDisabled={inputState !== 'success'} onClick={send}>
                    <Translation id="SEND_TRANSACTION" />
                </ButtonSend>
            </ButtonWrapper>
        </>
    );
};

export default Raw;
