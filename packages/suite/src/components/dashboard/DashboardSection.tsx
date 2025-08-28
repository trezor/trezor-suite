import {
    HTMLAttributes,
    ReactElement,
    ReactNode,
    Ref,
    forwardRef,
    useEffect,
    useState,
} from 'react';

import { Box, Column, H3, IconButton, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

type DashboardSectionProps = HTMLAttributes<HTMLDivElement> & {
    heading: ReactElement;
    subheading?: ReactElement;
    text?: ReactNode;
    actions?: ReactElement;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    onCollapseChange?: (collapsed: boolean) => void;
    'data-testid'?: string;
};

export const DashboardSection = forwardRef(
    (
        {
            heading,
            subheading,
            text,
            actions,
            collapsible = false,
            defaultCollapsed = false,
            onCollapseChange,
            children,
            'data-testid': dataTestId,
            ...rest
        }: DashboardSectionProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const [collapsed, setCollapsed] = useState(defaultCollapsed);

        useEffect(() => {
            onCollapseChange?.(collapsed);
        }, [collapsed, onCollapseChange]);

        return (
            <div ref={ref} {...rest}>
                <Column data-testid={dataTestId} gap={spacings.md}>
                    <Column width="100%" gap={spacings.xs}>
                        <Box>
                            <Row as="header" justifyContent="space-between">
                                {heading && (
                                    <H3>
                                        <Row as="span">{heading}</Row>
                                    </H3>
                                )}

                                {actions && <div>{actions}</div>}
                                {collapsible && (
                                    <IconButton
                                        icon={collapsed ? 'caretDown' : 'caretUp'}
                                        size="small"
                                        variant="tertiary"
                                        onClick={() => setCollapsed(prev => !prev)}
                                    ></IconButton>
                                )}
                            </Row>
                            {subheading}
                        </Box>
                        {text && <Paragraph variant="tertiary">{text}</Paragraph>}
                    </Column>
                    {!collapsed && children}
                </Column>
            </div>
        );
    },
);
