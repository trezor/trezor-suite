export const isBetaOnly = !window.location.href.startsWith('https://connect.trezor.io/9/');

export const BetaOnly = (props: React.PropsWithChildren) => {
    if (isBetaOnly) {
        return <>{props.children}</>;
    }

    return null;
};
