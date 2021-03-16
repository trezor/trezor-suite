import React from 'react';
import styled from 'styled-components';
import { useSpring, useTransition, config, animated } from 'react-spring';
import { Switch, Button, variables } from '@trezor/components';
import { useAnalytics, useActions, useSelector, useOnboarding } from '@suite-hooks';
import { Translation } from '@suite-components';

import DataAnalytics from './DataAnalytics';
import SecurityCheck from './SecurityCheck';

interface Props {
    initialized: boolean;
}

const PreOnboardingSetup = ({ initialized }: Props) => {
    // TODO typed substeps
    const { activeSubStep } = useOnboarding();

    if (activeSubStep === 'security-check') {
        // 2nd substep
        return <SecurityCheck initialized={initialized} />;
    }

    // 1st substep
    return <DataAnalytics />;
};

export default PreOnboardingSetup;
