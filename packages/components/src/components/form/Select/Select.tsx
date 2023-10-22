import { useCallback, useRef, ReactNode } from 'react';
import ReactSelect, { Props as ReactSelectProps, StylesConfig, SelectInstance } from 'react-select';
import styled, { css, DefaultTheme, useTheme } from 'styled-components';
import { borders, spacingsPx, typography, zIndices } from '@trezor/theme';

import { INPUT_HEIGHTS, baseInputStyle } from '../InputStyles';
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
    option: (base, { isFocused }) => ({
        ...base,
        background: isFocused ? theme.backgroundSurfaceElevation0 : 'transparent',
    }),
});

type WrapperProps = Pick<
    SelectProps,
    | 'isClean'
    | 'hideTextCursor'
    | 'withDropdownIndicator'
    | 'isDisabled'
    | 'minWidth'
    | 'size'
    | 'menuIsOpen'
    | 'isSearchable'
>;

const Wrapper = styled.div<WrapperProps>`
    width: 100%;

    ${({ isClean }) =>
        !isClean &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        `}

    .${reactSelectClassNamePrefix}__dropdown-indicator {
        display: ${({ withDropdownIndicator }) => (!withDropdownIndicator ? 'none' : 'flex')};
        align-items: center;
        color: ${({ theme, isDisabled }) => (isDisabled ? theme.iconDisabled : theme.iconSubdued)};
        padding: 0;
        transition: transform 0.2s cubic-bezier(0.68, -0.02, 0.21, 1.1);
        cursor: pointer;
    }

    .${reactSelectClassNamePrefix}__control {
        ${baseInputStyle}
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        height: ${({ isClean, size }) => (isClean ? 22 : size && INPUT_HEIGHTS[size])}px;
        padding: ${({ isClean }) => (isClean ? 0 : `0 ${spacingsPx.md}`)};
        border-style: ${({ isClean }) => (isClean ? 'none' : 'solid')};
        background: ${({ isClean }) => isClean && 'transparent !important'};
        box-shadow: none;
        ${typography.body};
        cursor: pointer;

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
        color: ${({ theme, isDisabled }) => (isDisabled ? theme.textDisabled : theme.textSubdued)};
        ${typography.body}
    }

    .${reactSelectClassNamePrefix}__value-container {
        display: flex;
        flex-wrap: nowrap;
        min-width: ${({ minWidth }) => minWidth};
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
            cursor: ${({ hideTextCursor, isSearchable }) =>
                hideTextCursor || !isSearchable ? 'pointer' : 'text'};
        }
    }

    .${reactSelectClassNamePrefix}__input {
        width: ${({ hideTextCursor }) => (hideTextCursor ? '2px' : 'auto')};
        margin: ${({ hideTextCursor }) => (hideTextCursor ? 0 : '2px')};
        color: ${({ theme }) => theme.textDefault} !important;

        ${typography.body};
    }

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
        border-radius: ${borders.radii.xs};
        color: ${({ theme }) => theme.textDefault};
        ${typography.body};
        cursor: pointer;

        :active {
            background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        }
    }
`;

// Prevent closing the menu when scrolling through options.
const closeMenuOnScroll = (e: Event) =>
    !(e.target as Element)?.className?.startsWith(reactSelectClassNamePrefix);

export type Option = any;

interface CommonProps extends Omit<ReactSelectProps<Option>, 'onChange'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    label?: ReactNode;
    wrapperProps?: Record<string, any>;
    size?: InputSize;
    noError?: boolean;
    bottomText?: ReactNode;
    hideTextCursor?: boolean; // this prop hides blinking text cursor
    minWidth?: string;
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
    hideTextCursor = false,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    isClean = false,
    label,
    size = 'large',
    noError = true,
    bottomText,
    useKeyPressScroll,
    isSearchable = false,
    minWidth = 'initial',
    menuIsOpen,
    inputState,
    components,
    onChange,
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
            withDropdownIndicator={withDropdownIndicator}
            size={size}
            hideTextCursor={hideTextCursor}
            minWidth={minWidth}
            isDisabled={isDisabled}
            menuIsOpen={menuIsOpen}
            {...wrapperProps}
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
                {...props}
                components={{
                    Control: controlProps => <Control {...controlProps} dataTest={dataTest} />,
                    Option: optionProps => <Option {...optionProps} dataTest={dataTest} />,
                    GroupHeading,
                    ...components,
                }}
            />

            {!noError && (
                <BottomText inputState={inputState} isDisabled={isDisabled}>
                    {bottomText}
                </BottomText>
            )}
        </Wrapper>
    );
};
