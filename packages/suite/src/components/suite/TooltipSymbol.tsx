import { ReactNode } from 'react';

import { Icon, IconName, Tooltip } from '@trezor/components';
import { CSSColor } from '@trezor/theme';

type TooltipSymbolProps = {
    content: ReactNode;
    icon?: IconName;
    iconColor?: CSSColor;
    className?: string;
};

/**
 * @deprecated Use Tooltip hasIcon prop.
 */
const TooltipSymbol = ({
    content,
    icon = 'question',
    iconColor,
    className,
}: TooltipSymbolProps) => (
    <Tooltip
        display="inline-block"
        margin={{ horizontal: 4 }}
        content={content}
        maxWidth={250}
        // eslint-disable-next-line local-rules/no-classname-on-component
        className={className}
    >
        <Icon name={icon} size={16} color={iconColor} />
    </Tooltip>
);

export default TooltipSymbol;
