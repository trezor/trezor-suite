import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { WrappedNativeTokenStackRoutes } from '@suite-native/navigation';

/** Screens of the standalone flow, resolved from the flow type shared by the wrap/unwrap hooks. */
export const wrappedNativeTokenFlowRoutes = {
    wrap: {
        complete: WrappedNativeTokenStackRoutes.WrapNativeTokenComplete,
        form: WrappedNativeTokenStackRoutes.WrapNativeToken,
        review: WrappedNativeTokenStackRoutes.WrapNativeTokenReview,
    },
    unwrap: {
        complete: WrappedNativeTokenStackRoutes.UnwrapNativeTokenComplete,
        form: WrappedNativeTokenStackRoutes.UnwrapNativeToken,
        review: WrappedNativeTokenStackRoutes.UnwrapNativeTokenReview,
    },
} as const satisfies Record<
    WrappedNativeFlowType,
    Record<'complete' | 'form' | 'review', WrappedNativeTokenStackRoutes>
>;
