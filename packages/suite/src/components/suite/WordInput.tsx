import { memo } from 'react';
import { SelectInstance, StylesConfig, createFilter } from 'react-select';

import { Select } from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import { bip39 } from '@trezor/crypto-utils';
import { resolveAfter } from '@trezor/utils';

import { useTranslation } from 'src/hooks/suite/useTranslation';

const options = bip39.map(item => ({ label: item, value: item }));

type Option = { label: string; value: string };

const styles: StylesConfig<Option, boolean> = {
    menuList: base => ({
        ...base,
        maxHeight: '180px',
    }),
};

export const WordInput = memo(() => {
    const { translationString } = useTranslation();

    return (
        <Select
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            isSearchable
            isClearable={false}
            isMenuOpen
            styles={styles}
            noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                translationString('TR_WORD_DOES_NOT_EXIST', { word: inputValue })
            }
            onChange={async (item: Option, ref?: SelectInstance<Option, boolean> | null) => {
                await resolveAfter(600);
                TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: item.value });
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
