import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Loading } from 'src/components/suite';

const StyledLoading = styled(Loading)`
    height: 100%;
`;

interface InitialLoadingProps {
    timeout: number;
}

export const InitialLoading = ({ timeout }: InitialLoadingProps) => {
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
