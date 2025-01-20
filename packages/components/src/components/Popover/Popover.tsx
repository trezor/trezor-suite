import * as React from 'react';
import { CSSProperties, forwardRef, HTMLProps } from 'react';

import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useClick,
    useDismiss,
    useRole,
    useInteractions,
    useMergeRefs,
    FloatingPortal,
    FloatingFocusManager,
} from '@floating-ui/react';
import { useTheme } from 'styled-components';

import { zIndices } from '@trezor/theme';

import { intermediaryTheme } from '../../config/colors';
import { PopoverPlacement, convertPopoverPlacement } from './utils';

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
    offset?: number;
};

export function usePopover({
    isInitialOpen = false,
    placement = DEFAULT_POPOVER_PLACEMENT,
    isOpen: controlledOpen,
    onOpenChange: setControlledOpen,
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
            offset(DEFAULT_POPOVER_OFFSET),
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
    const theme = useTheme();

    if (!floatingContext.open) return null;

    const floatingProps = context.getFloatingProps(htmlProps);

    // When the popover is rendered in a separate root (e.g. outside the main DOM like Storybook)
    // it doesn't inherit text color, so we set it explicitly.
    const color = intermediaryTheme[theme.variant as 'dark' | 'light'].textDefault;

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

export function Popover({
    content,
    isInitialOpen,
    placement,
    isOpen,
    children,
}: PopoverProps & { children: React.ReactNode }) {
    const popover = usePopover({ isInitialOpen, placement, isOpen });

    return (
        <PopoverContext.Provider value={popover}>
            <PopoverTrigger>{children}</PopoverTrigger>
            <PopoverContent style={{ zIndex: zIndices.popover }}>{content}</PopoverContent>
        </PopoverContext.Provider>
    );
}
