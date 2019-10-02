import React from 'react';
import SuiteLayout from '@suite-components/SuiteLayout';

interface Props {
    children: React.ReactNode;
}

const StaticPageWrapper = (props: Props) => {
    return (
        <SuiteLayout fullscreenMode disableNotifications disableModals>
            {props.children}
        </SuiteLayout>
    );
};

export default StaticPageWrapper;
