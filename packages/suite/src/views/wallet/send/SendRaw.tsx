import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { analytics, EventType } from '@trezor/suite-analytics';
import { Card, Textarea, Button, Tooltip, H3, Icon } from '@trezor/components';
import { sendFormActions, pushSendFormRawTransactionThunk } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { tryGetAccountIdentity, getInputState, isHexValid } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { spacingsPx } from '@trezor/theme';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledCard = styled(Card)`
    position: relative;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const CloseIcon = styled(Icon)`
    position: absolute;
    right: ${spacingsPx.md};
    top: ${spacingsPx.md};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledTextarea = styled(Textarea)`
    margin: ${spacingsPx.md} 0 ${spacingsPx.lg};

    > :first-child {
        background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
        border-color: ${({ theme }) => theme.borderElevation2};
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const SendButton = styled(Button)`
    margin: 0 auto;
    min-width: 120px;
`;

const INPUT_NAME = 'rawTx';

type SendRawProps = {
    account: Account;
};

export const SendRaw = ({ account }: SendRawProps) => {
    const {
        register,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            [INPUT_NAME]: '',
        },
    });
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const inputValue = watch(INPUT_NAME);
    const error = errors[INPUT_NAME];
    const inputState = getInputState(error);
    const prefix = account.networkType === 'ethereum' ? '0x' : undefined;

    const { ref: inputRef, ...inputField } = register(INPUT_NAME, {
        required: translationString('RAW_TX_NOT_SET'),
        validate: (value: string) => {
            if (!isHexValid(value, prefix)) return translationString('DATA_NOT_VALID_HEX');
        },
    });

    const cancel = () => dispatch(sendFormActions.sendRaw(false));

    const send = async () => {
        const result = await dispatch(
            pushSendFormRawTransactionThunk({
                tx: inputValue,
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
            }),
        ).unwrap();

        if (result) {
            setValue(INPUT_NAME, '');
            analytics.report({
                type: EventType.SendRawTransaction,
                payload: {
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    const isSubmitDisabled = inputState === 'error' || !inputValue;

    return (
        <StyledCard>
            <H3>
                <Tooltip
                    addon={
                        <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/send-raw.md" />
                    }
                    content={<Translation id="SEND_RAW_TRANSACTION_TOOLTIP" />}
                    dashed
                >
                    <Translation id="SEND_RAW" />
                </Tooltip>
            </H3>

            <CloseIcon variant="tertiary" size="small" name="close" onClick={cancel} />

            <StyledTextarea
                inputState={inputState}
                data-testid={INPUT_NAME}
                defaultValue={inputValue}
                bottomText={error?.message || null}
                label={<Translation id="RAW_TRANSACTION" />}
                innerRef={inputRef}
                {...inputField}
            />

            <SendButton isDisabled={isSubmitDisabled} onClick={send}>
                <Translation id="SEND_TRANSACTION" />
            </SendButton>
        </StyledCard>
    );
};
