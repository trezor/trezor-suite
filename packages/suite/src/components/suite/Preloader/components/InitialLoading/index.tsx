import React, { useEffect, useState } from 'react';
import { Loading } from '@suite-components';
import styled from 'styled-components';

const StyledLoading = styled(props => <Loading {...props} />)`
    height: 100%;
`;

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

    return <StyledLoading noBackground />;
};

export default InitialLoading;
