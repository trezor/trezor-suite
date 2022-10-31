import React from 'react';

import { TranslationKey } from '@suite-components/Translation/components/BaseTranslation';
import { Translation } from '@suite-components';
import { useTheme, Icon, Tooltip, IconType } from '@trezor/components';

interface UtxoTagProps {
    icon: IconType;
    tooltipMessage: TranslationKey;
}

export const UtxoTag = ({ icon, tooltipMessage }: UtxoTagProps) => {
    const theme = useTheme();

    return (
        <Tooltip interactive={false} content={<Translation id={tooltipMessage} />}>
            <Icon icon={icon} color={theme.TYPE_DARK_GREY} size={16} />
        </Tooltip>
    );
};
