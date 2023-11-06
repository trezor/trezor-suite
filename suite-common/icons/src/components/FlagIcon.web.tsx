import { FC } from 'react';

import { FlagIconName } from '../icons';

type FlagIconProps = {
    name: FlagIconName;
    size?: FlagIconSize;
};

const flagIconSizes = {
    s: 30,
} as const;

type FlagIconSize = keyof typeof flagIconSizes;

// This will be used for web in the future
export const FlagIcon: FC<FlagIconProps> = () => null;
