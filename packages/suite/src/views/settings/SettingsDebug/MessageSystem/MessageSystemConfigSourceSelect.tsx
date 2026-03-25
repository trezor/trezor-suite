import { useCallback } from 'react';

import {
    type MessageSystemConfigSource,
    initMessageSystemThunk,
    messageSystemActions,
    selectMessageSystemConfigSource,
} from '@suite-common/message-system';
import { SelectBar } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

type ConfigSourceOption = {
    label: string;
    value: MessageSystemConfigSource;
};

const options: ConfigSourceOption[] = [
    {
        label: 'Remote',
        value: 'remote',
    },
    {
        label: 'Local',
        value: 'local',
    },
];

export const MessageSystemConfigSourceSelect = () => {
    const selectedConfigSource = useSelector(selectMessageSystemConfigSource);
    const dispatch = useDispatch();

    const onChange = useCallback(
        (value: MessageSystemConfigSource) => {
            dispatch(messageSystemActions.setConfigSource(value));
            dispatch(initMessageSystemThunk());
        },
        [dispatch],
    );

    return (
        <SectionItem data-testid="@settings/debug/message-system/source">
            <TextColumn
                title="Config Source"
                description="Load config from remote file or use local override for debugging and testing."
            />
            <ActionColumn>
                <SelectBar
                    selectedOption={selectedConfigSource}
                    options={options}
                    onChange={onChange}
                    size="small"
                />
            </ActionColumn>
        </SectionItem>
    );
};
