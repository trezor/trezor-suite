import React, { useEffect, useState } from 'react';
import { Loading } from '@suite-components';
import styled from 'styled-components';

const StyledLoading = styled(props => <Loading {...props} />)`
    height: 100%;
`;

type InitialLoadingProps = {
    timeout: number;
};

const InitialLoading = ({ timeout }: InitialLoadingProps) => {
    const [tooLong, setTooLong] = useState(false);

    useEffect(() => {
        const interval = setTimeout(() => {
            setTooLong(true);
        }, timeout * 1000);
        return () => {
            clearTimeout(interval);
        };
    }, [timeout]);

    if (tooLong) {
        // throws an error to trigger error boundary where user can send a report and/or clear storage and reload
        // don't throw if there is already error from db or connect
        throw Error('Loading takes too long');
    }

    return <StyledLoading />;
};

export default InitialLoading;
