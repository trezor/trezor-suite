import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type MessageSystemConfigSource,
    initMessageSystemThunk,
    messageSystemActions,
    selectMessageSystemConfigSource,
} from '@suite-common/message-system';
import { Select, type SelectItemType } from '@suite-native/atoms';

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
            title="Environment"
            items={options}
            value={messageSystemConfigSource}
            onSelectItem={handleSelect}
            isLabelShown
        />
    );
};
