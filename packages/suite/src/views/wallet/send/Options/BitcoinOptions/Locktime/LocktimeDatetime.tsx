import { type ReactElement } from 'react';

import { getUnixTime } from 'date-fns';

import { Translation, useTranslation } from '@suite/intl';
import { getCurrentUTCDatetime, parseUTCdatetime } from '@suite-common/suite-utils';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { Input, Row, Text } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

export const inputName = 'bitcoinLocktimeDatetime';

type LocktimeDatetimeProps = {
    rightContent?: ReactElement;
};

export const LocktimeDatetime = ({ rightContent }: LocktimeDatetimeProps) => {
    const {
        composeTransaction,
        formState: { errors },
        register,
        watch,
    } = useSendFormContext();

    const { translationString } = useTranslation();

    const inputValue = watch(inputName);
    const error = errors[inputName];

    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => {
            composeTransaction();
        },
        required: translationString('LOCKTIME_IS_NOT_SET'),
        validate: {
            valid: (value: string | undefined) => {
                if (value === undefined || parseUTCdatetime(value) === undefined) {
                    return translationString('LOCKTIME_INVALID_DATETIME');
                }
            },
            too_low: (value: string | undefined) => {
                const parsedUTCdatetime = value === undefined ? undefined : parseUTCdatetime(value);
                if (parsedUTCdatetime && getUnixTime(parsedUTCdatetime) < BTC_LOCKTIME_VALUE) {
                    return translationString('LOCKTIME_IS_TOO_LOW');
                }
            },
            too_big: (value: string | undefined) => {
                const parsedUTCdatetime = value === undefined ? undefined : parseUTCdatetime(value);
                if (parsedUTCdatetime && getUnixTime(parsedUTCdatetime) > 0xffffffff) {
                    return translationString('LOCKTIME_IS_TOO_BIG');
                }
            },
        },
    });

    return (
        <Input
            hasError={!!error}
            defaultValue={inputValue}
            bottomText={
                <Row justifyContent="space-between" width="100%">
                    <Text>{error?.message || ''}</Text>
                    <Text intent="neutral" priority="secondary">
                        <Translation
                            id="LOCKTIME_CURRENT_UTC"
                            values={{ datetime: getCurrentUTCDatetime() }}
                        />
                    </Text>
                </Row>
            }
            labelLeft={
                <Text typographyStyle="body-sm">
                    <Translation id="LOCKTIME_DESCRIPTION" />
                </Text>
            }
            placeholder="DD/MM/YYYY HH:MM"
            rightContent={rightContent}
            innerRef={inputRef}
            data-testid="locktime-datetime-input"
            {...inputField}
        />
    );
};
