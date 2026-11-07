import {
    type ComponentType,
    type LazyExoticComponent,
    Suspense,
    lazy,
    useEffect,
    useState,
} from 'react';

import { SelectFallback } from './SelectFallback';
import { type SelectProps } from './types';
import { FormCell, allowedFormCellFrameProps, pickFormCellProps } from '../FormCell/FormCell';

/**
 * react-select (with its emotion runtime) loads with the first rendered Select, not with the app.
 * A failed download renders a disabled control instead of crashing the app. Each Select keeps the
 * component it mounted with, so its re-renders never download again, and the failed control re-arms
 * the loader once it has committed, so the next mounted Select tries once more.
 */
let SelectInner: LazyExoticComponent<ComponentType<SelectProps>>;

const loadSelectInner = (): Promise<{ default: ComponentType<SelectProps> }> =>
    import('./SelectInner').then(
        module => ({ default: module.SelectInner }),
        () => {
            const failedSelectInner = SelectInner;

            const SelectLoadFailed = ({ size, isClean, hasError }: SelectProps) => {
                /**
                 * Re-armed after the commit, not in the loader: React renders a tree that has not
                 * committed yet again once the load settles, and a fresh lazy there downloads again.
                 */
                useEffect(() => {
                    if (SelectInner === failedSelectInner) {
                        SelectInner = lazy(loadSelectInner);
                    }
                }, []);

                return (
                    <SelectFallback size={size} isClean={isClean} hasError={hasError} isDisabled />
                );
            };

            return { default: SelectLoadFailed };
        },
    );

SelectInner = lazy(loadSelectInner);

export const allowedSelectFrameProps = allowedFormCellFrameProps;

export type { Option, SelectProps, SelectRef } from './types';
export { SelectOption } from './SelectOption';

export const Select = (props: SelectProps) => {
    const [MountedSelectInner] = useState(() => SelectInner);
    const { size = 'large', isClean, isLoading } = props;
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
                    />
                }
            >
                <MountedSelectInner {...props} />
            </Suspense>
        </FormCell>
    );
};
