import React from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import {
    type MessageSystemConfigSource,
    initMessageSystemThunk,
    messageSystemActions,
    selectMessageSystemConfigSource,
} from '@suite-common/message-system';
import { selectDispatch } from '@suite-common/redux-utils';
import { Select, type SelectItemType } from '@suite-native/atoms';

const options: SelectItemType<MessageSystemConfigSource>[] = [
    { label: 'Remote', value: 'remote' },
    { label: 'Local', value: 'local' },
];

export const MessageSystemConfigSourceSelect = () => {
    const { dispatch } = useServices(selectDispatch);

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
