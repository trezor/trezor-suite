import { useCallback, useRef, ReactNode, useMemo } from 'react';
import ReactSelect, { Props as ReactSelectProps, StylesConfig, SelectInstance } from 'react-select';

import styled, { css, DefaultTheme, useTheme } from 'styled-components';

import {
    borders,
    spacings,
    spacingsPx,
    typography,
    typographyStylesBase,
    zIndices,
    Elevation,
} from '@trezor/theme';

import { INPUT_HEIGHTS, LABEL_TRANSFORM, Label, baseInputStyle } from '../styles';
import { InputSize } from '../types';
import {
    FormCell,
    FormCellProps,
    allowedFormCellFrameProps,
    pickFormCellProps,
} from '../FormCell/FormCell';
import {
    Control,
    ControlComponentProps,
    GroupHeading,
    Option,
    OptionComponentProps,
} from './customComponents';
import { useOnKeyDown } from './useOnKeyDown';
import { useDetectPortalTarget } from './useDetectPortalTarget';
import { DROPDOWN_MENU, menuStyle } from '../../Dropdown/menuStyle';
import { useElevation } from '../../ElevationContext/ElevationContext';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { TransientProps } from '../../../utils/transientProps';
import { FrameProps } from '../../../utils/frameProps';

const reactSelectClassNamePrefix = 'react-select';

export const allowedSelectFrameProps = allowedFormCellFrameProps;
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSelectFrameProps)[number]>;

const createSelectStyle = (
    theme: DefaultTheme,
    isRenderedInModal: boolean,
): StylesConfig<Option, boolean> => ({
    menuPortal: base => ({
        ...base,
        zIndex: isRenderedInModal ? zIndices.modal : zIndices.selectMenu,
    }),
    // menu styles are here because of the portal
    menu: base => ({
        ...base,
        // should be the same as menuStyle !!!
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: spacings.sm,
        minWidth: 140,
        borderRadius: borders.radii.md,
        background: theme.backgroundSurfaceElevation1,
        boxShadow: theme.boxShadowElevated,
        animation: `${DROPDOWN_MENU.getName()} 0.15s ease-in-out`,
        listStyleType: 'none',
        overflow: 'hidden',
        // when theme changes from light to dark
        transition: 'background 0.3s',
        border: 'none',
    }),
    groupHeading: base => ({
        ...base,
        margin: 0,
        padding: spacings.xs,
        ...{
            ...typographyStylesBase.label,
            lineHeight: `${typographyStylesBase.label.lineHeight}px`,
        },
        textTransform: 'initial',
    }),
    group: base => ({
        ...base,
        padding: 0,

        '& + &': {
            paddingTop: spacingsPx.xxs,
            marginTop: spacingsPx.xxs,
        },
    }),
    option: (base, { isFocused }) => ({
        ...base,
        padding: `${spacingsPx.xs} ${spacingsPx.sm}`,
        borderRadius: borders.radii.xxs,
        background: isFocused ? theme.backgroundSurfaceElevation2 : 'transparent',

        color: theme.textDefault,
        ...{
            ...typographyStylesBase.body,
            lineHeight: `${typographyStylesBase.body.lineHeight}px`,
        },
        cursor: 'pointer',

        '&:active': {
            background: theme.backgroundSurfaceElevation0,
        },
    }),
});

type WrapperProps = TransientProps<
    Pick<
        SelectProps,
        'isClean' | 'isDisabled' | 'minValueWidth' | 'size' | 'isMenuOpen' | 'isSearchable'
    >
> & {
    $isWithLabel: boolean;
    $isWithPlaceholder: boolean;
    $elevation: Elevation;
    $isLoading?: boolean;
};

const SelectWrapper = styled.div<WrapperProps>`
    /* stylelint-disable selector-class-pattern */
    width: 100%;
    position: relative;

    ${({ $isClean }) =>
        !$isClean &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        `}

    .${reactSelectClassNamePrefix}__dropdown-indicator {
        align-items: center;
        color: ${({ theme, $isDisabled }) =>
            $isDisabled ? theme.iconDisabled : theme.iconSubdued};
        padding: 0;
        transition: transform 0.2s cubic-bezier(0.68, -0.02, 0.21, 1.1);
        cursor: pointer;
    }

    .${reactSelectClassNamePrefix}__control {
        padding: ${({ $isClean }) => ($isClean ? 0 : `0 ${spacingsPx.md}`)};
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        height: ${({ $isClean, $size }) => ($isClean ? 22 : $size && INPUT_HEIGHTS[$size])}px;
        border-style: ${({ $isClean }) => ($isClean ? 'none' : 'solid')};
        box-shadow: none;
        cursor: pointer;
        ${baseInputStyle}
        background-color: ${({ $isClean }) => $isClean && 'transparent !important'};

        &:hover:not(:focus-within) {
            border-color: transparent;
        }

        &:focus-within {
            .${reactSelectClassNamePrefix}__dropdown-indicator {
                transform: rotate(180deg);
            }
        }
    }

    .${reactSelectClassNamePrefix}__placeholder {
        display: ${({ $isWithPlaceholder }) => !$isWithPlaceholder && 'none'};
        color: ${({ theme, $isDisabled }) =>
            $isDisabled ? theme.textDisabled : theme.textSubdued};
        ${typography.body}
    }

    .${reactSelectClassNamePrefix}__value-container {
        display: flex;
        flex-wrap: nowrap;
        min-width: ${({ $minValueWidth }) => $minValueWidth};
        justify-content: ${({ $isClean }) => ($isClean ? 'flex-end' : 'flex-start')};
        padding: 0 ${spacingsPx.xl} 0 0;
        border: none;
    }

    .${reactSelectClassNamePrefix}__single-value {
        position: static;
        display: ${({ $isLoading }) => ($isLoading ? 'none' : 'flex')};
        align-items: center;
        justify-content: ${({ $isClean }) => ($isClean ? 'flex-end' : 'flex-start')};
        max-width: initial;
        color: ${({ $isDisabled, theme }) =>
            $isDisabled ? theme.textDisabled : theme.textDefault};
        border-style: none;
        transform: none;
        margin: 0;

        &:hover {
            cursor: ${({ $isSearchable }) => ($isSearchable ? 'text' : 'pointer')};
        }
    }

    .${reactSelectClassNamePrefix}__single-value + .${reactSelectClassNamePrefix}__input-container {
        margin-left: 0;
    }

    .${reactSelectClassNamePrefix}__input-container {
        &:hover {
            cursor: ${({ $isSearchable }) => ($isSearchable ? 'text' : 'pointer')};
        }
    }

    .${reactSelectClassNamePrefix}__input {
        color: ${({ theme }) => theme.textDefault} !important;

        ${typography.body};
    }

    ${({ $isClean, $size }) =>
        !$isClean &&
        css`
            .${reactSelectClassNamePrefix}__indicators {
                position: absolute;
                top: ${$size === 'small' ? spacingsPx.xs : spacingsPx.md};
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

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            pointer-events: auto;
            cursor: not-allowed;
        `}
`;

const SelectLabel = styled(Label)`
    /* move up when input is focused OR has a placeholder OR has value  */
    div:focus-within ~ &,
    div:has(div.react-select__single-value:not(:empty)) ~ &,
    div:has(div.react-select__placeholder:not(:empty)) ~ & {
        transform: ${LABEL_TRANSFORM};
    }
`;

const SpinnerWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: ${spacingsPx.md};
    transform: translateY(-50%);
`;

// Prevent closing the menu when scrolling through options.
const closeMenuOnScroll = (e: Event) =>
    !(e.target as Element)?.className?.startsWith(reactSelectClassNamePrefix);

export type Option = any;

// Make sure isSearchable can't be defined if useKeyPressScroll===true
// If useKeyPressScroll is false or undefined, isSearchable is a boolean value
type KeyPressScrollProps =
    | { useKeyPressScroll: true; isSearchable?: never }
    | { useKeyPressScroll?: false; isSearchable?: boolean };

export type SelectProps = KeyPressScrollProps &
    AllowedFrameProps &
    Omit<FormCellProps, 'children'> &
    Omit<ReactSelectProps<Option>, 'onChange' | 'menuIsOpen'> & {
        isClean?: boolean;
        label?: ReactNode;
        size?: InputSize;
        minValueWidth?: string;
        isMenuOpen?: boolean;
        isLoading?: boolean;
        onChange?: (value: Option, ref?: SelectInstance<Option, boolean> | null) => void;
        'data-testid'?: string;
    };

export const Select = ({
    isClean = false,
    label,
    size = 'large',
    useKeyPressScroll,
    isSearchable = false,
    minValueWidth = 'initial',
    isMenuOpen,
    components,
    onChange,
    placeholder,
    isLoading = false,
    'data-testid': dataTest,
    ...rest
}: SelectProps) => {
    const selectRef = useRef<SelectInstance<Option, boolean>>(null);
    const { elevation } = useElevation();
    const theme = useTheme();
    const onKeyDown = useOnKeyDown(selectRef, useKeyPressScroll);
    const menuPortalTarget = useDetectPortalTarget(selectRef);
    const formCellProps = pickFormCellProps(rest);
    const { isDisabled } = formCellProps;
    const isRenderedInModal = menuPortalTarget !== null;

    const handleOnChange = useCallback<Required<ReactSelectProps>['onChange']>(
        (value, { action }) => {
            if (value) {
                onChange?.(value, selectRef.current);

                if (!isMenuOpen && action === 'select-option') {
                    selectRef.current?.blur();
                }
            }

            return null;
        },
        [onChange, isMenuOpen],
    );

    /**
     * This memoization is necessary to prevent jumping of the Select
     * to the corder. This may happen when parent component re-renders
     * and if this is not the same object for some reason it won't work.
     */
    const memoizedComponents = useMemo(
        () => ({
            Control: (controlProps: ControlComponentProps) => (
                <Control {...controlProps} data-testid={dataTest} />
            ),
            Option: (optionProps: OptionComponentProps) => (
                <Option {...optionProps} data-testid={dataTest} />
            ),
            GroupHeading,
            ...components,
        }),
        [components, dataTest],
    );

    return (
        <FormCell {...formCellProps}>
            <SelectWrapper
                $isClean={isClean}
                $elevation={elevation}
                $isSearchable={isSearchable}
                $size={size}
                $minValueWidth={minValueWidth}
                $isDisabled={isDisabled}
                $isLoading={isLoading}
                $isMenuOpen={isMenuOpen}
                $isWithLabel={!!label}
                $isWithPlaceholder={!!placeholder}
            >
                <ReactSelect
                    ref={selectRef}
                    onKeyDown={onKeyDown}
                    classNamePrefix={reactSelectClassNamePrefix}
                    openMenuOnFocus
                    closeMenuOnScroll={closeMenuOnScroll}
                    menuPosition="fixed" // Required for closeMenuOnScroll to work properly when near page bottom
                    menuPortalTarget={menuPortalTarget}
                    styles={createSelectStyle(theme, isRenderedInModal)}
                    onChange={handleOnChange}
                    isSearchable={isSearchable}
                    menuIsOpen={isMenuOpen}
                    isDisabled={isDisabled ?? false}
                    menuPlacement="auto"
                    placeholder={placeholder || ''}
                    {...rest}
                    components={memoizedComponents}
                />

                {isLoading && (
                    <SpinnerWrapper>
                        <Spinner size={24} isGrey={false} />
                    </SpinnerWrapper>
                )}

                {label && (
                    <SelectLabel $size={size} $isDisabled={isDisabled}>
                        {label}
                    </SelectLabel>
                )}
            </SelectWrapper>
        </FormCell>
    );
};
