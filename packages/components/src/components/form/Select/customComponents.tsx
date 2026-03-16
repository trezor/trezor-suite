import { type ReactNode, useEffect, useRef } from 'react';
import {
    type ControlProps,
    type DropdownIndicatorProps,
    type GroupHeadingProps,
    type GroupProps,
    type IndicatorsContainerProps,
    type MenuListProps,
    type MenuProps,
    type OptionProps,
    type PlaceholderProps,
    type SingleValueProps,
    type ValueContainerProps,
    components,
} from 'react-select';

import styled, { useTheme } from 'styled-components';

import type { Option as OptionType } from './types';
import { Box } from '../../Box/Box';
import { Column, Row } from '../../Flex/Flex';
import { Icon } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { Text } from '../../typography/Text/Text';
import { FloatingLabel } from '../FloatingLabel';
import { InputWrapper } from '../InputWrapper';
import { type InputSize } from '../types';
import {
    INPUT_PADDING,
    mapSizeToHeight,
    mapSizeToPaddingTop,
    mapSizeToTypographyStyle,
} from '../utils';

const DropdownWrapper = styled.div<{ $isOpen: boolean }>`
    transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
    transition: transform 0.2s ease-in-out;
`;

type ControlComponentProps = ControlProps<OptionType, boolean> & {
    'data-testid'?: string;
    hasError?: boolean;
    label?: ReactNode;
    size: InputSize;
    isClean?: boolean;
};

export const Control = ({
    'data-testid': dataTest,
    children,
    hasError,
    label,
    size,
    isClean,
    ...props
}: ControlComponentProps) => {
    const {
        isDisabled,
        hasValue,
        selectProps: { isLoading, placeholder, isSearchable },
    } = props;

    return (
        <components.Control {...props}>
            <InputWrapper
                hasError={hasError}
                isDisabled={isDisabled || isLoading}
                size={size}
                isClean={isClean}
            >
                {label && !isLoading && !isClean && (
                    <FloatingLabel
                        $isActive={hasValue || !!placeholder || !!isSearchable}
                        $isDisabled={isDisabled}
                    >
                        {label}
                    </FloatingLabel>
                )}
                <Row
                    height={isClean ? undefined : mapSizeToHeight(size)}
                    gap={4}
                    padding={isClean ? undefined : { horizontal: INPUT_PADDING }}
                    overflow="hidden"
                    data-testid={dataTest ? `${dataTest}/input` : undefined}
                    cursor="pointer"
                >
                    {children}
                </Row>
            </InputWrapper>
        </components.Control>
    );
};

export const Menu = ({ children, ...props }: MenuProps<OptionType, boolean>) => {
    const theme = useTheme();

    return (
        <components.Menu {...props}>
            <Box
                flex="1"
                minWidth={140}
                borderRadius={16}
                backgroundColor="baseFillSurfaceModeless"
                borderColor="baseBorderSurfaceModeless"
                borderWidth={1}
                shadow={theme.boxShadowElevated}
                overflow="auto"
                width="fit-content"
            >
                {children}
            </Box>
        </components.Menu>
    );
};

export const MenuList = ({ children, ...props }: MenuListProps<OptionType, boolean>) => {
    const isGrouped = props.selectProps.options.some(option => option.options);

    return (
        <components.MenuList
            {...props}
            innerProps={{
                ...props.innerProps,
                style: {
                    ...props.innerProps.style,
                    padding: 8,
                },
            }}
        >
            <Column gap={isGrouped ? 12 : 0}>{children}</Column>
        </components.MenuList>
    );
};

export const GroupHeading = ({ children, ...props }: GroupHeadingProps<OptionType, boolean>) =>
    children ? (
        <components.GroupHeading {...props}>
            <Text
                as="div"
                intent="neutral"
                priority="secondary"
                typographyStyle="body-xs"
                padding={{ horizontal: 8, vertical: 4 }}
            >
                {children}
            </Text>
        </components.GroupHeading>
    ) : null;

export const Group = ({ children, ...props }: GroupProps<OptionType, boolean>) => (
    <components.Group {...props}>
        <Column>{children}</Column>
    </components.Group>
);

type OptionComponentProps = OptionProps<OptionType, boolean> & {
    'data-testid'?: string;
    size: InputSize;
};

export const Option = ({
    'data-testid': dataTest,
    size,
    children,
    ...props
}: OptionComponentProps) => {
    const ref = useRef<HTMLDivElement>(undefined);

    useEffect(() => {
        if (props.isSelected) {
            ref.current?.scrollIntoView();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <components.Option
            {...props}
            innerRef={ref as any}
            innerProps={
                {
                    ...props.innerProps,
                    'data-testid': `${dataTest}/option/${
                        typeof props.data.value === 'string' ? props.data.value : props.label
                    }`,
                    style: {
                        ...props.innerProps.style,
                        scrollMarginTop: 8,
                    },
                } as OptionProps<OptionType, boolean>['innerProps']
            }
        >
            <Box
                borderRadius={8}
                backgroundColor={
                    props.isFocused && !props.isDisabled
                        ? 'stateFillElementGhostHovered'
                        : undefined
                }
                cursor={props.isDisabled ? 'default' : 'pointer'}
                padding={{ vertical: 6, horizontal: 8 }}
            >
                <Text
                    as="div"
                    intent="neutral"
                    typographyStyle={mapSizeToTypographyStyle(size)}
                    isDisabled={props.isDisabled}
                >
                    {children}
                </Text>
            </Box>
        </components.Option>
    );
};

type ValueContainerComponentProps = ValueContainerProps<OptionType> & {
    minValueWidth?: number;
    hasLabel?: boolean;
    size: InputSize;
};

export const ValueContainer = ({
    children,
    minValueWidth,
    hasLabel,
    size,
    ...props
}: ValueContainerComponentProps) =>
    props.selectProps.isLoading ? null : (
        <Row
            minWidth={minValueWidth}
            flex="1"
            overflow="hidden"
            padding={{
                top: hasLabel ? mapSizeToPaddingTop(size) : 0,
            }}
            cursor={props.selectProps.isSearchable ? 'text' : 'inherit'}
        >
            {children}
        </Row>
    );

export const SingleValue = ({ children }: SingleValueProps<OptionType>) => (
    <Text ellipsisLineCount={1} as="div" maxWidth="100%">
        {children}
    </Text>
);

export const IndicatorsContainer = ({
    children,
    ...props
}: IndicatorsContainerProps<OptionType>) => (
    <Row justifyContent="space-between" width={props.selectProps.isLoading ? '100%' : 'auto'}>
        {children}
    </Row>
);

export const DropdownIndicator = (props: DropdownIndicatorProps) => (
    <DropdownWrapper $isOpen={props.selectProps.menuIsOpen}>
        <Icon
            name="caretDown"
            size={20}
            {...(props.isDisabled
                ? { isDisabled: true }
                : { intent: 'neutral', priority: 'secondary' })}
        />
    </DropdownWrapper>
);

export const LoadingIndicator = () => <Spinner size={20} />;

export const Placeholder = ({ children }: PlaceholderProps<OptionType>) => (
    <Text ellipsisLineCount={1} isDisabled as="div">
        {children}
    </Text>
);
