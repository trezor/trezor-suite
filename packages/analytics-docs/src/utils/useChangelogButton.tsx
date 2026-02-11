import React from 'react';

import { IconButton, Tooltip } from '@trezor/components';

export const useChangelogButton = () => {
    const [isChangelogOpened, setIsChangelogOpened] = React.useState<boolean>(false);

    return {
        isChangelogOpened,
        ChangelogButton: () => (
            <Tooltip content={`${isChangelogOpened ? 'Hide' : 'Show'} changelog`}>
                <IconButton
                    onClick={() => {
                        setIsChangelogOpened(!isChangelogOpened);
                    }}
                    icon="note"
                    intent={isChangelogOpened ? 'brand' : 'neutral'}
                    size="small"
                    priority="secondary"
                />
            </Tooltip>
        ),
    };
};
