import { useCallback, useRef, ReactNode } from 'react';
import ReactSelect, { Props as ReactSelectProps, StylesConfig, SelectInstance } from 'react-select';
import styled, { css, DefaultTheme, useTheme } from 'styled-components';
import { borders, spacingsPx, typography, zIndices } from '@trezor/theme';

import { INPUT_HEIGHTS, LABEL_TRANSFORM, Label, baseInputStyle } from '../InputStyles';
import { BottomText } from '../BottomText';
import { InputState, InputSize } from '../inputTypes';
import { Control, GroupHeading, Option } from './customComponents';
import { useOnKeyDown } from './useOnKeyDown';
import { useDetectPortalTarget } from './useDetectPortalTarget';
import { menuStyle } from '../../Dropdown/menuStyle';

const reactSelectClassNamePrefix = 'react-select';

const createSelectStyle = (theme: DefaultTheme): StylesConfig<Option, boolean> => ({
    menuPortal: base => ({
        ...base,
        zIndex: zIndices.modal /* Necessary to be visible inside a Modal */,
    }),
    menu: base => ({
        ...base,
        background: theme.backgroundSurfaceElevation1,
    }),
    option: (base, { isFocused }) => ({
        ...base,
        background: isFocused ? theme.backgroundSurfaceElevation0 : 'transparent',
    }),
});

type WrapperProps = Pick<
    SelectProps,
    'isClean' | 'isDisabled' | 'minValueWidth' | 'size' | 'menuIsOpen' | 'isSearchable'
> & { isWithLabel: boolean; isWithPlaceholder: boolean };

const Wrapper = styled.div<WrapperProps>`
    position: relative;
    width: 100%;

    ${({ isClean }) =>
        !isClean &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        `}

    .${reactSelectClassNamePrefix}__dropdown-indicator {
        display: flex;
        align-items: center;
        color: ${({ theme, isDisabled }) => (isDisabled ? theme.iconDisabled : theme.iconSubdued)};
        padding: 0;
        transition: transform 0.2s cubic-bezier(0.68, -0.02, 0.21, 1.1);
        cursor: pointer;
    }

    .${reactSelectClassNamePrefix}__control {
        padding: ${({ isClean }) => (isClean ? 0 : `0 ${spacingsPx.md}`)};
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        height: ${({ isClean, size }) => (isClean ? 22 : size && INPUT_HEIGHTS[size])}px;
        border-style: ${({ isClean }) => (isClean ? 'none' : 'solid')};
        box-shadow: none;
        cursor: pointer;
        ${baseInputStyle}
        background-color: ${({ isClean }) => isClean && 'transparent !important'};

        :hover:not(:focus-within) {
            border-color: transparent;
        }

        :focus-within {
            .${reactSelectClassNamePrefix}__dropdown-indicator {
                transform: rotate(180deg);
            }
        }
    }

    .${reactSelectClassNamePrefix}__placeholder {
        display: ${({ isWithPlaceholder }) => !isWithPlaceholder && 'none'};
        color: ${({ theme, isDisabled }) => (isDisabled ? theme.textDisabled : theme.textSubdued)};
        ${typography.body}
    }

    .${reactSelectClassNamePrefix}__value-container {
        display: flex;
        flex-wrap: nowrap;
        min-width: ${({ minValueWidth }) => minValueWidth};
        justify-content: ${({ isClean }) => (isClean ? 'flex-end' : 'flex-start')};
        padding: 0;
        border: none;
    }

    .${reactSelectClassNamePrefix}__single-value {
        position: static;
        display: flex;
        align-items: center;
        justify-content: ${({ isClean }) => (isClean ? 'flex-end' : 'flex-start')};
        width: 100%;
        max-width: initial;
        color: ${({ isDisabled, theme }) => (isDisabled ? theme.textDisabled : theme.textDefault)};
        border-style: none;
        transform: none;

        :hover {
            cursor: ${({ isSearchable }) => isSearchable && 'text'};
        }
    }

    .${reactSelectClassNamePrefix}__input {
        color: ${({ theme }) => theme.textDefault} !important;

        ${typography.body};
    }

    ${({ isClean, size }) =>
        !isClean &&
        css`
            .${reactSelectClassNamePrefix}__indicators {
                position: absolute;
                top: ${size === 'small' ? spacingsPx.xs : spacingsPx.md};
                right: ${spacingsPx.md};
            }
        `}

    .${reactSelectClassNamePrefix}__indicator-separator {
        display: none;
    }

    .${reactSelectClassNamePrefix}__menu {
        ${menuStyle}
        border: none;
        z-index: ${zIndices.base};
    }

    .${reactSelectClassNamePrefix}__group-heading {
        margin: 0;
        padding: ${spacingsPx.xs};
        ${typography.label};
        text-transform: initial;
    }

    .${reactSelectClassNamePrefix}__group {
        padding: 0;

        & + & {
            padding-top: ${spacingsPx.xxs};
            margin-top: ${spacingsPx.xxs};
        }
    }

    .${reactSelectClassNamePrefix}__option {
        padding: ${spacingsPx.xs} ${spacingsPx.sm};
        border-radius: ${borders.radii.xxs};
        color: ${({ theme }) => theme.textDefault};
        ${typography.body};
        cursor: pointer;

        :active {
            background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        }
    }
`;

const SelectLabel = styled(Label)`
    /* move up when input is focused OR has a placeholder OR has value  */
    div:focus-within ~ &,
    div:has(div.react-select__single-value:not(:empty)) ~ &,
    div:has(div.react-select__placeholder:not(:empty)) ~ & {
        transform: ${LABEL_TRANSFORM};
    }
`;

// Prevent closing the menu when scrolling through options.
const closeMenuOnScroll = (e: Event) =>
    !(e.target as Element)?.className?.startsWith(reactSelectClassNamePrefix);

export type Option = any;

interface CommonProps extends Omit<ReactSelectProps<Option>, 'onChange'> {
    isClean?: boolean;
    label?: ReactNode;
    size?: InputSize;
    /**
     * @description pass `null` if bottom text can be `undefined`
     */
    bottomText?: ReactNode;
    minValueWidth?: string;
    inputState?: InputState;
    onChange?: (value: Option, ref?: SelectInstance<Option, boolean> | null) => void;
    'data-test'?: string;
}

// Make sure isSearchable can't be defined if useKeyPressScroll===true
// If useKeyPressScroll is false or undefined, isSearchable is a boolean value
type KeyPressScrollProps =
    | { useKeyPressScroll: true; isSearchable?: never }
    | { useKeyPressScroll?: false; isSearchable?: boolean };

export type SelectProps = CommonProps & KeyPressScrollProps;

export const Select = ({
    className,
    isClean = false,
    label,
    size = 'large',
    bottomText,
    useKeyPressScroll,
    isSearchable = false,
    minValueWidth = 'initial',
    menuIsOpen,
    inputState,
    components,
    onChange,
    placeholder,
    isDisabled,
    'data-test': dataTest,
    ...props
}: SelectProps) => {
    const selectRef = useRef<SelectInstance<Option, boolean>>(null);

    const theme = useTheme();
    const onKeyDown = useOnKeyDown(selectRef, useKeyPressScroll);
    const menuPortalTarget = useDetectPortalTarget(selectRef);

    const handleOnChange = useCallback<Required<ReactSelectProps>['onChange']>(
        (value, { action }) => {
            if (value) {
                onChange?.(value, selectRef.current);

                if (!menuIsOpen && action === 'select-option') {
                    selectRef.current?.blur();
                }
            }
            return null;
        },
        [onChange, menuIsOpen],
    );

    return (
        <Wrapper
            className={className}
            isClean={isClean}
            isSearchable={isSearchable}
            size={size}
            minValueWidth={minValueWidth}
            isDisabled={isDisabled}
            menuIsOpen={menuIsOpen}
            isWithLabel={!!label}
            isWithPlaceholder={!!placeholder}
        >
            <ReactSelect
                ref={selectRef}
                onKeyDown={onKeyDown}
                classNamePrefix={reactSelectClassNamePrefix}
                openMenuOnFocus
                closeMenuOnScroll={closeMenuOnScroll}
                menuPosition="fixed" // Required for closeMenuOnScroll to work properly when near page bottom
                menuPortalTarget={menuPortalTarget}
                styles={createSelectStyle(theme)}
                onChange={handleOnChange}
                isSearchable={isSearchable}
                menuIsOpen={menuIsOpen}
                isDisabled={isDisabled}
                placeholder={placeholder || ''}
                {...props}
                components={{
                    Control: controlProps => <Control {...controlProps} dataTest={dataTest} />,
                    Option: optionProps => <Option {...optionProps} dataTest={dataTest} />,
                    GroupHeading,
                    ...components,
                }}
            />

            {label && (
                <SelectLabel $size={size} isDisabled={isDisabled}>
                    {label}
                </SelectLabel>
            )}

            {bottomText && (
                <BottomText inputState={inputState} isDisabled={isDisabled}>
                    {bottomText}
                </BottomText>
            )}
        </Wrapper>
    );
};
