import React, { useEffect, useState } from 'react';
import { Loading } from '@suite-components';
import { useSelector } from '@suite-hooks';
import styled from 'styled-components';

const StyledLoading = styled(props => <Loading {...props} />)`
    height: 100%;
`;

const InitialLoading = () => {
    const [seconds, setSeconds] = useState(0);
    const { error, dbError } = useSelector(s => s.suite);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(seconds => seconds + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (seconds === 90 && !error && !dbError) {
            // throws an error to trigger error boundary where user can send a report and/or cleat storage and reload
            // don't throw if there is already error from db or connect
            throw Error('Loading takes too long');
        }
    }, [dbError, error, seconds]);

    return <StyledLoading noBackground />;
};

export default InitialLoading;
