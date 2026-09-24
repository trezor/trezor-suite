import { type HTMLAttributes, type ReactNode, type Ref } from 'react';

import {
    Button,
    type ButtonProps,
    Column,
    Paragraph,
    Row,
    Select,
    type SelectProps,
    Tooltip,
} from '@trezor/components';

import { OutlineHighlight } from '../OutlineHighlight/OutlineHighlight';

type TooltipProps = {
    tooltipContent?: ReactNode;
    isTooltipActive?: boolean;
};

type SectionItemButtonProps = ButtonProps & TooltipProps;

const SectionItemButton = ({
    children,
    minWidth = 140,
    tooltipContent,
    isTooltipActive,
    ...buttonProps
}: SectionItemButtonProps) => (
    <Tooltip content={tooltipContent} isActive={isTooltipActive} cursor="inherit">
        <Button {...buttonProps} minWidth={minWidth}>
            {children}
        </Button>
    </Tooltip>
);

type SectionItemSelectProps = SelectProps & TooltipProps;

const SectionItemSelect = ({
    size = 'small',
    width = 170,
    tooltipContent,
    isTooltipActive,
    ...selectProps
}: SectionItemSelectProps) => (
    <Tooltip content={tooltipContent} isActive={isTooltipActive} cursor="inherit">
        <Select {...selectProps} size={size} width={width} />
    </Tooltip>
);

type SectionItemCommonProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
    shouldHighlight?: boolean;
    ref?: Ref<HTMLDivElement>;
};

type StructuredSectionItemProps = {
    title?: ReactNode;
    description?: ReactNode;
    bottomContent?: ReactNode;
    actions?: ReactNode;
    children?: never;
};

type CustomSectionItemProps = {
    children: ReactNode;
    title?: never;
    description?: never;
    bottomContent?: never;
    actions?: never;
};

type SectionItemProps = SectionItemCommonProps &
    (StructuredSectionItemProps | CustomSectionItemProps);

const SectionItemBase = ({
    title,
    description,
    bottomContent,
    actions,
    children,
    shouldHighlight,
    ref,
    ...rest
}: SectionItemProps) => (
    <div ref={ref} {...rest}>
        <OutlineHighlight
            shouldHighlight={shouldHighlight}
            offset={{ vertical: 16, horizontal: 20 }}
        >
            <Row width="100%" gap={24} flexWrap="wrap" justifyContent="space-between">
                {children ? (
                    children
                ) : (
                    <>
                        <Column flex="1" gap={12} maxWidth={500} minWidth="50%">
                            {title && <Paragraph typographyStyle="body-md">{title}</Paragraph>}
                            {description && (
                                <Paragraph
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {description}
                                </Paragraph>
                            )}
                            {bottomContent}
                        </Column>
                        {actions && (
                            <Row gap={8} flexWrap="wrap">
                                {actions}
                            </Row>
                        )}
                    </>
                )}
            </Row>
        </OutlineHighlight>
    </div>
);

SectionItemBase.Button = SectionItemButton;
SectionItemBase.Select = SectionItemSelect;

export const SectionItem = SectionItemBase;
