import { type ReactNode, memo, useState } from 'react';

import {
    type LayoutContextPayload,
    LayoutPayloadContext,
    LayoutSetterContext,
} from 'src/support/suite/LayoutContext';

type LayoutPayloadProviderProps = {
    children: ReactNode;
};

/**
 * Owns the payload that pages publish through `useLayout`. The state lives here instead of in
 * `SuiteLayout` so that a page publishing a new header re-renders only the layout slots, not the
 * whole app root. `children` is the very same element on every re-render, so React skips the
 * subtree and only the slot consumers below re-render.
 *
 * Memoised for the same reason as `SuiteLayout`: nothing above it should be able to re-render the
 * payload owner, which would re-render every slot consumer with it.
 */
export const LayoutPayloadProvider = memo(function LayoutPayloadProvider({
    children,
}: LayoutPayloadProviderProps) {
    const [payload, setLayoutPayload] = useState<LayoutContextPayload>({});

    return (
        <LayoutSetterContext.Provider value={setLayoutPayload}>
            <LayoutPayloadContext.Provider value={payload}>
                {children}
            </LayoutPayloadContext.Provider>
        </LayoutSetterContext.Provider>
    );
});
