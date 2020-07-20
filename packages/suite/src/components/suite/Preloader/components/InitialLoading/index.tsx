import React, { useEffect, useState } from 'react';
import { Loading } from '@suite-components';

const InitialLoading = () => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(seconds => seconds + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (seconds > 30) {
            // throws an error to trigger error boundary where user can send a report and/or cleat storage and reload
            throw Error('Loading takes too long');
        }
    }, [seconds]);

    return <Loading noBackground />;
};

export default InitialLoading;
