import React, { useState, useEffect } from 'react';

interface Props {
    children: React.ReactNode;
    fallbackComponent?: React.ReactNode;
}

const NoSSR = ({ children, fallbackComponent = null }: Props) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // should fire on equivalent of componentDidMount
        setShouldRender(true);
    }, []);

    return shouldRender ? children : fallbackComponent;
};

export default NoSSR;
