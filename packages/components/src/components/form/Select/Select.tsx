import { type ComponentType, Suspense, lazy, startTransition, useState } from 'react';

import { SelectFallback } from './SelectFallback';
import { SelectLoadFailed } from './SelectLoadFailed';
import { type SelectInnerProps, type SelectProps } from './types';
import { FormCell, allowedFormCellFrameProps, pickFormCellProps } from '../FormCell/FormCell';

// react-select (with its emotion runtime) loads with the first rendered Select, not with the app.
// A failed download renders a disabled control instead of crashing the app. Each Select keeps the
// component it mounted with, so its re-renders never download again, and the failed control
// reloads it once it has committed, so the next mounted Select tries once more.
const loadSelectInner = (): Promise<{ default: ComponentType<SelectInnerProps> }> =>
    import('./SelectInner').then(
        module => ({ default: module.SelectInner }),
        () => ({ default: SelectLoadFailed }),
    );

let SelectInner = lazy(loadSelectInner);

// Called by the failed control after the commit, not by the loader: React renders a tree that has
// not committed yet again once the load settles, and a fresh lazy there would download again.
const reloadSelectInner = (failedSelectInner: typeof SelectInner) => {
    if (SelectInner === failedSelectInner) {
        SelectInner = lazy(loadSelectInner);
    }
};

export const allowedSelectFrameProps = allowedFormCellFrameProps;

export type { Option, SelectProps, SelectRef } from './types';
export { SelectOption } from './SelectOption';

export const Select = (props: SelectProps) => {
    const [MountedSelectInner] = useState(() => SelectInner);
    // A press on the empty control while react-select loads is replayed on the loaded one.
    const [isPressedWhileLoading, setIsPressedWhileLoading] = useState(false);
    const { size = 'large', isClean, isLoading, 'data-testid': dataTest } = props;
    const formCellProps = pickFormCellProps(props);
    const { hasError, isDisabled } = formCellProps;

    return (
        <FormCell {...formCellProps} data-component="Select">
            <Suspense
                fallback={
                    <SelectFallback
                        size={size}
                        isClean={isClean}
                        hasError={hasError}
                        isDisabled={isDisabled || isLoading}
                        /**
                         * Not urgent: a sync render could commit the loaded control mid-click,
                         * and the rest of that click would then close it.
                         */
                        onPress={() => startTransition(() => setIsPressedWhileLoading(true))}
                        onPressCancel={() => setIsPressedWhileLoading(false)}
                        data-testid={dataTest ? `${dataTest}/loading` : undefined}
                    />
                }
            >
                <MountedSelectInner
                    {...props}
                    isPressedWhileLoading={isPressedWhileLoading}
                    onLoadFailed={() => reloadSelectInner(MountedSelectInner)}
                />
            </Suspense>
        </FormCell>
    );
};
