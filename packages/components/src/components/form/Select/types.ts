import { type ReactNode } from 'react';
import { type Props as ReactSelectProps } from 'react-select';

import { type FrameProps } from '../../../utils/frameProps';
import { type FormCellProps, type allowedFormCellFrameProps } from '../FormCell/FormCell';
import { type InputSize } from '../types';

export type Option = any;

export type SelectMenuAlign = 'start' | 'end';

/** Props threaded to the custom components through react-select's `selectProps`. */
export type CustomSelectProps = {
    /** Match the menu width to the control instead of sizing it to the longest option. */
    isMenuFullWidth?: boolean;
    /**
     * Horizontal alignment of the menu relative to the control. Use `end` when the
     * menu is wider than the control and should grow toward the start (left in LTR).
     */
    menuAlign?: SelectMenuAlign;
};

type AllowedFrameProps = Pick<FrameProps, (typeof allowedFormCellFrameProps)[number]>;

// This intentionally exposes only the capability used by consumers instead of deriving it from
// react-select's generic SelectInstance, which would leak that implementation type into our public API.
export type SelectRef = {
    clearValue: () => void;
};

export type SelectProps = AllowedFrameProps &
    Omit<FormCellProps, 'children'> &
    Omit<ReactSelectProps<Option>, 'onChange' | 'menuIsOpen' | 'styles'> &
    CustomSelectProps & {
        label?: ReactNode;
        size?: InputSize;
        minValueWidth?: number;
        isClean?: boolean;
        isMenuOpen?: boolean;
        isLoading?: boolean;
        onChange?: (value: Option, ref?: SelectRef | null) => void;
        'data-testid'?: string;
        openMenuOnFocus?: boolean;
        /** When using menuPortalTarget (e.g. in modals), set this so the menu appears above the modal */
        menuPortalZIndex?: number;
    };

/** What `Select` renders lazily: its react-select part, or the control shown when that fails to load. */
export type SelectInnerProps = SelectProps & {
    /** Called by the failed-load control once it has committed, so the next Select loads again. */
    onLoadFailed: () => void;
    /** The placeholder was pressed while this part loaded, so the control opens as if clicked. */
    isPressedWhileLoading: boolean;
};
