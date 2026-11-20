import { useFetchOtc } from '@suite-common/trading';

import { ConciergeForm } from './ConciergeForm';
import { ConciergeFormContextProvider } from './ConciergeFormContextProvider';
import { ConciergeFormSkeleton } from './ConciergeFormSkeleton';

export const ConciergeTabContent = () => {
    const { data: otcData, isLoading } = useFetchOtc();

    if (isLoading) {
        return <ConciergeFormSkeleton />;
    }

    return (
        <ConciergeFormContextProvider defaultCountryCode={otcData?.country}>
            <ConciergeForm />
        </ConciergeFormContextProvider>
    );
};
