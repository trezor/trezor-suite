import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { MessageSystemConfigSource } from '@suite-common/message-system';
import {
    initMessageSystemThunk,
    messageSystemActions,
    selectMessageSystemConfigSource,
} from '@suite-common/message-system';
import type { SelectItemType } from '@suite-native/atoms';
import { Select } from '@suite-native/atoms';

const options: SelectItemType<MessageSystemConfigSource>[] = [
    { label: 'Remote', value: 'remote' },
    { label: 'Local', value: 'local' },
];

export const MessageSystemConfigSourceSelect = () => {
    const dispatch = useDispatch();

    const messageSystemConfigSource = useSelector(selectMessageSystemConfigSource);

    const handleSelect = (configSource: MessageSystemConfigSource) => {
        dispatch(messageSystemActions.setConfigSource(configSource));
        dispatch(initMessageSystemThunk());
    };

    return (
        <Select<MessageSystemConfigSource>
            items={options}
            title="Environment"
            value={messageSystemConfigSource}
            onSelectItem={handleSelect}
        />
    );
};
