import { type ComponentProps, type ComponentType, createContext, useContext } from 'react';

import type { Option } from './customComponents';

type SelectOptionProps = ComponentProps<typeof Option>;

/** Filled by the lazily loaded react-select part of `Select`, the only place options render. */
export const SelectOptionContext = createContext<ComponentType<SelectOptionProps> | null>(null);

/** The default option of `Select`, for custom `components.Option` that wrap its content. */
export const SelectOption = (props: SelectOptionProps) => {
    const Option = useContext(SelectOptionContext);

    return Option ? <Option {...props} /> : null;
};
