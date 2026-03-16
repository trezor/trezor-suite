import { memo } from 'react';
import { type SelectInstance, createFilter } from 'react-select';

import { useTranslation } from '@suite/intl';
import { Select } from '@trezor/components';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';
import { bip39 } from '@trezor/crypto-utils';
import { resolveAfter } from '@trezor/utils';

const options = bip39.map(item => ({ label: item, value: item }));

type Option = { label: string; value: string };

export const WordInput = memo(() => {
    const { translationString } = useTranslation();

    return (
        <Select
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            isSearchable
            isClearable={false}
            isMenuOpen
            noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                translationString('TR_WORD_DOES_NOT_EXIST', { word: inputValue })
            }
            onChange={async (item: Option, ref?: SelectInstance<Option, boolean> | null) => {
                await resolveAfter(600);
                TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_WORD, payload: item.value });
                ref?.clearValue();
            }}
            options={options}
            filterOption={createFilter({
                ignoreCase: true,
                trim: true,
                matchFrom: 'start',
            })}
            data-testid="@word-input-select"
        />
    );
});

WordInput.displayName = 'WordInput';
