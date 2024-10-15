export const isBetaOnly = !process.env.CONNECT_EXPLORER_FULL_URL?.startsWith(
    'https://connect.trezor.io/9/',
);

export const BetaOnly = (props: React.PropsWithChildren) => {
    if (isBetaOnly) {
        return <>{props.children}</>;
    }

    return null;
};
