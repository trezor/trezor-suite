import { Icon } from '@trezor/components';
import { GradientIcon } from '@trezor/icons';

import { type SecurityChecklistItem } from './types';

const _stringIcon: SecurityChecklistItem = {
    // @ts-expect-error icon must be a ReactElement<IconProps, typeof Icon>, not a plain string
    icon: 'string',
    content: <div />,
};

const _iconElement: SecurityChecklistItem = {
    icon: <Icon as={GradientIcon} />,
    content: <div />,
};

void _stringIcon;
void _iconElement;
