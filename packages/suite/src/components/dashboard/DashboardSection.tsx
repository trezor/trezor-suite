import {
    type HTMLAttributes,
    type ReactElement,
    type Ref,
    forwardRef,
    useEffect,
    useState,
} from 'react';

import { Translation } from '@suite/intl';
import { Collapsible, Column, H3, IconButton, Row, Text } from '@trezor/components';
import { CaretDownIcon, CaretUpIcon } from '@trezor/icons';
import { useCurrentRef } from '@trezor/react-utils';

type DashboardSectionProps = HTMLAttributes<HTMLDivElement> & {
    heading?: ReactElement;
    subheading?: ReactElement;
    actions?: ReactElement;
    areActionsBelowSubheading?: boolean;
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
            areActionsBelowSubheading = false,
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
        const actionsNode = actions ? <div>{actions}</div> : null;

        return (
            <div ref={ref} {...rest}>
                <Collapsible isOpen={!collapsed}>
                    <Column data-testid={dataTestId} gap={16}>
                        {renderHeader && (
                            <Column width="100%" gap={2}>
                                <Row
                                    as="header"
                                    justifyContent="space-between"
                                    flexWrap="wrap"
                                    gap={8}
                                >
                                    {heading && (
                                        <H3>
                                            <Row
                                                data-testid="@dashboard/dashboard-section/heading"
                                                as="span"
                                            >
                                                {heading}
                                            </Row>
                                        </H3>
                                    )}

                                    <Row gap={8}>
                                        {!areActionsBelowSubheading && actionsNode}
                                        {collapsible && (
                                            <Collapsible.Toggle
                                                onClick={() => setCollapsed(prev => !prev)}
                                            >
                                                <IconButton
                                                    icon={collapsed ? CaretDownIcon : CaretUpIcon}
                                                    intent="neutral"
                                                    priority="secondary"
                                                    tooltip={{
                                                        content: (
                                                            <Translation
                                                                id={
                                                                    collapsed
                                                                        ? 'TR_EXPAND'
                                                                        : 'TR_COLLAPSE'
                                                                }
                                                            />
                                                        ),
                                                    }}
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
                                {areActionsBelowSubheading && actionsNode}
                            </Column>
                        )}
                        <Collapsible.Content overflow="unset">{children}</Collapsible.Content>
                    </Column>
                </Collapsible>
            </div>
        );
    },
);
