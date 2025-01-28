import { useForm } from 'react-hook-form';

import { pushSendFormRawTransactionThunk, sendFormActions } from '@suite-common/wallet-core';
import { getInputState, isHexValid, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { Button, Card, H3, IconButton, Row, Textarea, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { OpenGuideFromTooltip } from 'src/components/guide';
import { Translation } from 'src/components/suite';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

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
                symbol: account.symbol,
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
        <Card>
            <Row justifyContent="space-between" margin={{ bottom: spacings.md }}>
                <H3>
                    <Tooltip
                        addon={
                            <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/send-raw.md" />
                        }
                        content={<Translation id="SEND_RAW_TRANSACTION_TOOLTIP" />}
                        hasIcon
                    >
                        <Translation id="SEND_RAW" />
                    </Tooltip>
                </H3>

                <IconButton variant="tertiary" icon="x" onClick={cancel} size="small" />
            </Row>

            <Textarea
                inputState={inputState}
                data-testid={INPUT_NAME}
                defaultValue={inputValue}
                bottomText={error?.message || null}
                label={<Translation id="RAW_TRANSACTION" />}
                innerRef={inputRef}
                {...inputField}
            />

            <Button isDisabled={isSubmitDisabled} onClick={send} margin={{ top: spacings.lg }}>
                <Translation id="SEND_TRANSACTION" />
            </Button>
        </Card>
    );
};
