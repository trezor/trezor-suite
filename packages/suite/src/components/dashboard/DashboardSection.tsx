import {
    type HTMLAttributes,
    type ReactElement,
    type Ref,
    forwardRef,
    useEffect,
    useState,
} from 'react';

import { Collapsible, Column, H3, IconButton, Row, Text } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';

type DashboardSectionProps = HTMLAttributes<HTMLDivElement> & {
    heading?: ReactElement;
    subheading?: ReactElement;
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
        const collapseChangeRef = useCurrentRef(onCollapseChange);

        useEffect(() => {
            collapseChangeRef.current?.(collapsed);
        }, [collapseChangeRef, collapsed]);

        const renderHeader = heading || subheading || actions || collapsible;

        return (
            <div ref={ref} {...rest}>
                <Collapsible isOpen={!collapsed}>
                    <Column data-testid={dataTestId} gap={16}>
                        {renderHeader && (
                            <Column width="100%" gap={2}>
                                <Row as="header" justifyContent="space-between">
                                    {heading && (
                                        <H3>
                                            <Row as="span">{heading}</Row>
                                        </H3>
                                    )}

                                    <Row gap={8}>
                                        {actions && <div>{actions}</div>}
                                        {collapsible && (
                                            <Collapsible.Toggle
                                                onClick={() => setCollapsed(prev => !prev)}
                                            >
                                                <IconButton
                                                    icon={collapsed ? 'caretDown' : 'caretUp'}
                                                    intent="neutral"
                                                    priority="secondary"
                                                />
                                            </Collapsible.Toggle>
                                        )}
                                    </Row>
                                </Row>
                                {subheading && (
                                    <Text intent="neutral" priority="secondary">
                                        {subheading}
                                    </Text>
                                )}
                            </Column>
                        )}
                        <Collapsible.Content overflow="unset">{children}</Collapsible.Content>
                    </Column>
                </Collapsible>
            </div>
        );
    },
);
