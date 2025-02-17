import * as React from 'react';
import { CSSProperties, HTMLProps, forwardRef, useImperativeHandle } from 'react';

import {
    FloatingFocusManager,
    FloatingPortal,
    autoUpdate,
    flip,
    offset,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useMergeRefs,
    useRole,
} from '@floating-ui/react';
import { useTheme } from 'styled-components';

import { zIndices } from '@trezor/theme';

import { PopoverPlacement, convertPopoverPlacement } from './utils';
import { intermediaryTheme } from '../../config/colors';

const DEFAULT_POPOVER_PLACEMENT: PopoverPlacement = {
    position: 'bottom',
    alignment: 'center',
};

const DEFAULT_POPOVER_OFFSET: number = 5;

export type PopoverProps = {
    isInitialOpen?: boolean;
    placement?: PopoverPlacement;
    isOpen?: boolean;
    content?: React.ReactNode;
    onOpenChange?: (isOpen: boolean) => void;
    onInteraction?: () => void;
    popoverOffset?: number;
    zIndex?: number;
};

export function usePopover({
    isInitialOpen = false,
    placement = DEFAULT_POPOVER_PLACEMENT,
    isOpen: controlledOpen,
    onOpenChange: setControlledOpen,
    popoverOffset = DEFAULT_POPOVER_OFFSET,
}: PopoverProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(isInitialOpen);
    const [labelId, setLabelId] = React.useState<string | undefined>();
    const [descriptionId, setDescriptionId] = React.useState<string | undefined>();

    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = setControlledOpen ?? setUncontrolledOpen;

    const calculatedPlacement = convertPopoverPlacement(placement);

    const data = useFloating({
        placement: calculatedPlacement,
        open,
        onOpenChange: setOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(popoverOffset),
            flip({
                crossAxis: calculatedPlacement.includes('-'),
                fallbackAxisSideDirection: 'end',
                padding: 5,
            }),
            shift({ padding: 5 }),
        ],
    });

    const { context } = data;

    const click = useClick(context, {
        enabled: controlledOpen == null,
    });
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const interactions = useInteractions([click, dismiss, role]);

    return React.useMemo(
        () => ({
            open,
            setOpen,
            ...interactions,
            ...data,

            labelId,
            descriptionId,
            setLabelId,
            setDescriptionId,
        }),
        [open, setOpen, interactions, data, labelId, descriptionId],
    );
}

type ContextType =
    | (ReturnType<typeof usePopover> & {
          setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
          setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
      })
    | null;

const PopoverContext = React.createContext<ContextType>(null);

export const usePopoverContext = () => {
    const context = React.useContext(PopoverContext);

    if (context == null) {
        throw new Error('Popover components must be wrapped in <Popover />');
    }

    return context;
};

type PopoverTriggerProps = {
    children: React.ReactNode;
};

export const PopoverTrigger = ({ children }: PopoverTriggerProps) => {
    const context = usePopoverContext();
    const ref = useMergeRefs([context.refs.setReference]);

    return (
        <div
            ref={ref}
            data-state={context.open ? 'open' : 'closed'}
            {...context.getReferenceProps()}
        >
            {children}
        </div>
    );
};

type PopoverContentProps = HTMLProps<HTMLDivElement> & {
    children: React.ReactNode;
};

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>((props, propRef) => {
    const { children, ...htmlProps } = props;
    const { context: floatingContext, ...context } = usePopoverContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);

    // When the popover is rendered in a separate root (e.g. outside the main DOM like Storybook)
    // it doesn't inherit text color, so we set it explicitly.
    const theme = useTheme();
    const themeVariant: keyof typeof intermediaryTheme =
        theme.variant === 'standard' ? 'light' : theme.variant;

    const color = intermediaryTheme[themeVariant]?.textDefault;

    if (!floatingContext.open) return null;

    const floatingProps = context.getFloatingProps(htmlProps);

    return (
        <FloatingPortal>
            <FloatingFocusManager context={floatingContext}>
                <div
                    ref={ref}
                    style={{
                        ...context.floatingStyles,
                        ...(floatingProps.style as CSSProperties),
                        color,
                    }}
                    aria-labelledby={context.labelId}
                    aria-describedby={context.descriptionId}
                    {...context.getFloatingProps()}
                >
                    {children}
                </div>
            </FloatingFocusManager>
        </FloatingPortal>
    );
});

export interface PopoverRef {
    open: () => void;
    close: () => void;
}

export const Popover = forwardRef(
    (
        {
            content,
            isInitialOpen,
            placement,
            isOpen,
            popoverOffset,
            zIndex = zIndices.popover,
            children,
        }: PopoverProps & { children: React.ReactNode },
        ref,
    ) => {
        const popover = usePopover({ isInitialOpen, placement, isOpen, popoverOffset });

        useImperativeHandle(ref, () => ({
            open: () => popover.setOpen(true),
            close: () => popover.setOpen(false),
        }));

        return (
            <PopoverContext.Provider value={popover}>
                <PopoverTrigger>{children}</PopoverTrigger>
                <PopoverContent style={{ zIndex }}>{content}</PopoverContent>
            </PopoverContext.Provider>
        );
    },
);
