import { ReactNode, useEffect, useRef } from 'react';
import {
    ControlProps,
    DropdownIndicatorProps,
    IndicatorsContainerProps,
    OptionProps,
    PlaceholderProps,
    SingleValueProps,
    ValueContainerProps,
    components,
} from 'react-select';

import styled from 'styled-components';

import type { Option as OptionType } from './types';
import { Row } from '../../Flex/Flex';
import { Icon } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { Text } from '../../typography/Text/Text';
import { FloatingLabel } from '../FloatingLabel';
import { InputWrapper } from '../InputWrapper';
import { InputSize } from '../types';
import { INPUT_PADDING, mapSizeToHeight, mapSizeToPaddingTop } from '../utils';

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
                {label && !isLoading && (
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

type OptionComponentProps = OptionProps<OptionType, boolean> & {
    'data-testid'?: string;
};

export const Option = ({ 'data-testid': dataTest, ...props }: OptionComponentProps) => {
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
                } as OptionProps<OptionType, boolean>['innerProps']
            }
        />
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
        <Icon name="caretDown" size={20} variant={props.isDisabled ? 'disabled' : 'tertiary'} />
    </DropdownWrapper>
);

export const LoadingIndicator = () => <Spinner size={20} isGrey={false} />;

export const Placeholder = ({ children }: PlaceholderProps<OptionType>) => (
    <Text ellipsisLineCount={1} variant="disabled" as="div">
        {children}
    </Text>
);
