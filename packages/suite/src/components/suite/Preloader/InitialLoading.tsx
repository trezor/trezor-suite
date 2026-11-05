import { useEffect, useState } from 'react';

import { LoadingWithMessage } from 'src/components/suite/LoadingWithMessage';

import { SlowLoadingMessage } from './SlowLoadingMessage';

const SLOW_LOADING_DELAY_MS = 10_000;

interface InitialLoadingProps {
    timeout: number;
}

export const InitialLoading = ({ timeout }: InitialLoadingProps) => {
    const [tooLong, setTooLong] = useState(false);
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() => {
        const slowTimeout = setTimeout(() => setIsSlow(true), SLOW_LOADING_DELAY_MS);

        return () => clearTimeout(slowTimeout);
    }, []);

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

    return <LoadingWithMessage message={isSlow && <SlowLoadingMessage />} />;
};
