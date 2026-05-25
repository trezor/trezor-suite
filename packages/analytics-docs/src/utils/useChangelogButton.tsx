import React from 'react';

import { IconButton } from '@trezor/components';

export const useChangelogButton = () => {
    const [isChangelogOpened, setIsChangelogOpened] = React.useState<boolean>(false);

    return {
        isChangelogOpened,
        ChangelogButton: () => (
            <IconButton
                onClick={() => {
                    setIsChangelogOpened(!isChangelogOpened);
                }}
                icon="clockCounterClockwise"
                intent={isChangelogOpened ? 'brand' : 'neutral'}
                size="small"
                priority="secondary"
                tooltip={{ content: `${isChangelogOpened ? 'Hide' : 'Show'} changelog` }}
            />
        ),
    };
};
