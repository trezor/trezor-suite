import {
    autoUpdate,
    flip,
    useFloating,
    useInteractions,
    useListNavigation,
    useTypeahead,
    useClick,
    useListItem,
    useDismiss,
    useRole,
    FloatingFocusManager,
    FloatingList,
} from '@floating-ui/react';
import * as React from 'react';

interface SelectContextValue {
    activeIndex: number | null;
    selectedIndex: number | null;
    getItemProps: ReturnType<typeof useInteractions>['getItemProps'];
    handleSelect: (index: number | null) => void;
}

const SelectContext = React.createContext<SelectContextValue>({} as SelectContextValue);

export function SelectFloatingUi({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
    const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);

    const { refs, floatingStyles, context } = useFloating({
        placement: 'bottom-start',
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [flip()],
    });

    const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
    const labelsRef = React.useRef<Array<string | null>>([]);

    const handleSelect = React.useCallback((index: number | null) => {
        setSelectedIndex(index);
        setIsOpen(false);
        if (index !== null) {
            setSelectedLabel(labelsRef.current[index]);
        }
    }, []);

    function handleTypeaheadMatch(index: number | null) {
        if (isOpen) {
            setActiveIndex(index);
        } else {
            handleSelect(index);
        }
    }

    const listNav = useListNavigation(context, {
        listRef: elementsRef,
        activeIndex,
        selectedIndex,
        onNavigate: setActiveIndex,
    });
    const typeahead = useTypeahead(context, {
        listRef: labelsRef,
        activeIndex,
        selectedIndex,
        onMatch: handleTypeaheadMatch,
    });
    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        listNav,
        typeahead,
        click,
        dismiss,
        role,
    ]);

    const selectContext = React.useMemo(
        () => ({
            activeIndex,
            selectedIndex,
            getItemProps,
            handleSelect,
        }),
        [activeIndex, selectedIndex, getItemProps, handleSelect],
    );

    return (
        <>
            <div ref={refs.setReference} tabIndex={0} {...getReferenceProps()}>
                {selectedLabel ?? 'Select...'}
            </div>
            <SelectContext.Provider value={selectContext}>
                {isOpen && (
                    <FloatingFocusManager context={context} modal={false}>
                        <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                            <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
                                {children}
                            </FloatingList>
                        </div>
                    </FloatingFocusManager>
                )}
            </SelectContext.Provider>
        </>
    );
}

export function OptionFloatingUi({ label }: { label: string }) {
    const { activeIndex, selectedIndex, getItemProps, handleSelect } =
        React.useContext(SelectContext);

    const { ref, index } = useListItem({ label });

    const isActive = activeIndex === index;
    const isSelected = selectedIndex === index;

    return (
        <button
            ref={ref}
            role="option"
            aria-selected={isActive && isSelected}
            tabIndex={isActive ? 0 : -1}
            style={{
                background: isActive ? 'cyan' : '',
                fontWeight: isSelected ? 'bold' : '',
            }}
            {...getItemProps({
                onClick: () => handleSelect(index),
            })}
        >
            {label}
        </button>
    );
}
