import React, { useState, useEffect } from 'react';

export const useIsBetaOnly = () => {
    const [isBetaOnly, setIsBetaOnly] = useState<boolean>(true);

    useEffect(() => {
        setIsBetaOnly(!window.location.href.startsWith('https://connect.trezor.io/9/'));
    }, []);

    return isBetaOnly;
};

export const BetaOnly = (props: React.PropsWithChildren) => {
    const isBetaOnly = useIsBetaOnly();

    if (isBetaOnly) {
        return <>{props.children}</>;
    }

    return null;
};
