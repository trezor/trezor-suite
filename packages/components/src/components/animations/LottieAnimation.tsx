import { type ComponentProps, Suspense, lazy } from 'react';

const LottieAnimationInner = lazy(() =>
    import('./LottieAnimationInner').then(module => ({ default: module.LottieAnimationInner })),
);

export function LottieAnimation(props: ComponentProps<typeof LottieAnimationInner>) {
    return (
        <Suspense fallback={null}>
            <LottieAnimationInner {...props} />
        </Suspense>
    );
}
