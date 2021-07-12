import React from 'react';
import { Tooltip } from '.';

/**
 * Simple wrapper for Tooltip to strip it from DOM if there is no tooltip content.
 * Maybe this could be the default Tooltip. But it's safer to have it as opt-in to not break anything.
 */
export const TooltipConditional: typeof Tooltip = ({ content, children, ...restProps }) =>
    content && children ? (
        <Tooltip content={content} {...restProps}>
            {children}
        </Tooltip>
    ) : (
        <>{children}</>
    );
