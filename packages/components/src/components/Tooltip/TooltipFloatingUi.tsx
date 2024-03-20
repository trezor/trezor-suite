import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useHover,
    useFocus,
    useDismiss,
    useRole,
    useInteractions,
    FloatingPortal,
    useMergeRefs,
    useTransitionStyles,
    arrow,
} from '@floating-ui/react';
import type { Placement, UseFloatingReturn } from '@floating-ui/react';
import {
    useState,
    useMemo,
    createContext,
    useContext,
    ReactNode,
    HTMLProps,
    forwardRef,
    isValidElement,
    cloneElement,
    useRef,
    RefObject,
    CSSProperties,
    MutableRefObject,
} from 'react';

/**
 * Based on https://floating-ui.com/docs/tooltip but heavily modified
 */

const TRANSITION_DURATION_MS = 250;

type ArrowRef = RefObject<SVGSVGElement>;

type Delay = {
    open: number;
    close: number;
};

interface TooltipOptions {
    isInitiallyOpen?: boolean;
    placement?: Placement;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    offset: number;
    delay: Delay;
}

type UseTooltipReturn = ReturnType<typeof useInteractions> & {
    open: boolean;
    setOpen: (open: boolean) => void;
    arrowRef: RefObject<SVGSVGElement>;
} & UseFloatingReturn;

export const useTooltip = ({
    isInitiallyOpen = false,
    placement = 'top',
    isOpen: isControlledOpen,
    onOpenChange: setControlledOpen,
    offset: offsetValue,
    delay,
}: TooltipOptions): UseTooltipReturn => {
    const arrowRef = useRef<SVGSVGElement>(null);
    const [isUncontrolledTooltipOpen, setIsUncontrolledTooltipOpen] = useState(isInitiallyOpen);

    const open = isControlledOpen ?? isUncontrolledTooltipOpen;
    const setOpen = setControlledOpen ?? setIsUncontrolledTooltipOpen;

    const data = useFloating({
        placement,
        open,
        onOpenChange: setOpen,
        whileElementsMounted: autoUpdate,
        middleware: [offset(offsetValue), flip(), shift(), arrow({ element: arrowRef })],
    });

    const { context } = data;

    const hover = useHover(context, {
        move: false,
        enabled: isControlledOpen == null,
        delay,
    });
    const focus = useFocus(context, {
        enabled: isControlledOpen == null,
    });
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'tooltip' });

    const interactions = useInteractions([hover, focus, dismiss, role]);

    return useMemo(
        () => ({
            open,
            setOpen,
            ...interactions,
            ...data,
            arrowRef,
        }),
        [open, setOpen, interactions, data],
    );
};

type ContextType = ReturnType<typeof useTooltip>;

export const TooltipContext = createContext<ContextType | null>(null);

export const useTooltipState = (): ContextType => {
    const context = useContext(TooltipContext);

    if (context == null) {
        throw new Error('Tooltip components must be wrapped in <Tooltip />');
    }

    return context;
};

type TooltipFloatingUiProps = { children: ReactNode } & TooltipOptions;

export const TooltipFloatingUi = ({ children, ...options }: TooltipFloatingUiProps) => {
    // This can accept any props as options, e.g. `placement`,
    // or other positioning options.
    const tooltip = useTooltip(options);

    return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

type TooltipTriggerProps = HTMLProps<HTMLElement>;

export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(
    ({ children, ...props }, propRef) => {
        const state = useTooltipState();

        const childrenRef = (children as any).ref;
        const ref = useMergeRefs([state.refs.setReference, propRef, childrenRef]);

        if (!isValidElement(children)) {
            return <div>Invalid React Element</div>;
        }

        return cloneElement(
            children,
            state.getReferenceProps({
                ref,
                ...props,
                ...children.props,
                'data-state': state.open ? 'open' : 'closed',
            }),
        );
    },
);

export type ArrowProps = { ref: ArrowRef; context: UseFloatingReturn['context'] };

type TooltipContentProps = HTMLProps<HTMLDivElement> & {
    arrowRender?: (props: ArrowProps) => ReactNode;
    appendTo?: HTMLElement | null | MutableRefObject<HTMLElement | null>;
};

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>((props, propRef) => {
    const { arrowRender, appendTo, ...htmlProps } = props;

    const state = useTooltipState();
    const ref = useMergeRefs([state.refs.setFloating, propRef]);

    const { isMounted, styles } = useTransitionStyles(state.context, {
        duration: TRANSITION_DURATION_MS,
        initial: {
            opacity: 0,
        },
    });

    if (!isMounted) return null;

    // This is needed to allow passing of custom styled into TooltipContent.
    // This required for z-index.
    //
    // @see https://floating-ui.com/docs/misc#z-index-stacking
    const floatingProps = state.getFloatingProps(htmlProps);
    const { style, children, ...restOfFloatingProps } = floatingProps;

    return (
        <FloatingPortal root={appendTo}>
            <div
                ref={ref}
                style={{
                    ...state.floatingStyles,
                    ...(style as CSSProperties),
                    ...styles,
                }}
                {...restOfFloatingProps}
            >
                {arrowRender?.({ ref: state.arrowRef, context: state.context })}
                {children as ReactNode}
            </div>
        </FloatingPortal>
    );
});
