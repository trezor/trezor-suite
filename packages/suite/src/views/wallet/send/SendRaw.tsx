import { useForm, useWatch } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { useSelector } from '@suite-common/redux-utils';
import {
    pushSendFormRawTransactionThunk,
    selectIsMevProtectionEnabled,
    sendFormActions,
} from '@suite-common/wallet-core';
import { isHexValid, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { Button, Card, H3, IconButton, Row, Textarea, Tooltip } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import { OpenGuideFromTooltip } from 'src/components/guide';
import { type Account } from 'src/types/wallet';

const INPUT_NAME = 'rawTx';

type SendRawProps = {
    account: Account;
};

export const SendRaw = ({ account }: SendRawProps) => {
    const {
        register,
        setValue,
        control,
        formState: { errors },
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            [INPUT_NAME]: '',
        },
    });
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const inputValue = useWatch({ control, name: INPUT_NAME });
    const error = errors[INPUT_NAME];
    const hasError = !!error;
    const prefix = account.networkType === 'ethereum' ? '0x' : undefined;

    const { ref: inputRef, ...inputField } = register(INPUT_NAME, {
        required: translationString('RAW_TX_NOT_SET'),
        validate: (value: string) => {
            if (!isHexValid(value, prefix)) return translationString('DATA_NOT_VALID_HEX');
        },
    });

    const cancel = () => dispatch(sendFormActions.sendRaw(false));

    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const send = async () => {
        const result = await dispatch(
            pushSendFormRawTransactionThunk({
                tx: inputValue,
                symbol: account.symbol,
                descriptor: account.descriptor,
                identity: tryGetAccountIdentity(account),
                isMevProtectionEnabled: isMevProtectionEnabled && isMevProtectionFeatureEnabled,
            }),
        ).unwrap();

        if (result) {
            setValue(INPUT_NAME, '');
            analytics.report({
                type: events.sendRawTransactionEvent.name,
                payload: {
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    const isSubmitDisabled = hasError || !inputValue;

    return (
        <Card>
            <Row justifyContent="space-between" margin={{ bottom: 16 }}>
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

                <IconButton
                    intent="neutral"
                    priority="secondary"
                    icon={XIcon}
                    onClick={cancel}
                    tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                />
            </Row>

            <Textarea
                hasError={hasError}
                data-testid={INPUT_NAME}
                defaultValue={inputValue}
                bottomText={error?.message || null}
                label={<Translation id="RAW_TRANSACTION" />}
                innerRef={inputRef}
                {...inputField}
            />

            <Button isDisabled={isSubmitDisabled} onClick={send} margin={{ top: 20 }}>
                <Translation id="SEND_TRANSACTION" />
            </Button>
        </Card>
    );
};
