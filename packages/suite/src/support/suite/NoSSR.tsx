import React, { useState, useEffect } from 'react';

interface Props {
    children: React.ReactNode;
    fallbackComponent?: any;
}

const NoSSR = ({ children, fallbackComponent = null }: Props) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // should fired on equivalent of componentDidMount
        setShouldRender(true);
    }, []);

    return shouldRender ? children : fallbackComponent;
};

export default NoSSR;
