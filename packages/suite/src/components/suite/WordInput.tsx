import { memo } from 'react';
import { SelectInstance, createFilter } from 'react-select';

import { useTranslation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Select } from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import { bip39 } from '@trezor/crypto-utils';
import { resolveAfter } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

const options = bip39.map(item => ({ label: item, value: item }));

type Option = { label: string; value: string };

export const WordInput = memo(() => {
    const { translationString } = useTranslation();
    const device = useSelector(selectSelectedDevice);

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
                if (!device) {
                    console.warn('WordInput: onChange called without device');

                    return;
                }
                await resolveAfter(600);
                TrezorConnect.uiResponse({
                    type: UI.RECEIVE_WORD,
                    payload: item.value,
                    device: { path: device.path },
                });
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
