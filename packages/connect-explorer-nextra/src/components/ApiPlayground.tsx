import React, { useEffect } from 'react';

import styled from 'styled-components';

import { Card, CollapsibleBox, variables } from '@trezor/components';

import { Method } from './Method';
import { useActions } from '../hooks';
import * as routerActions from '../actions/routerActions';

interface ApiPlaygroundProps {
    method: string;
}

const ApiPlaygroundWrapper = styled(Card)`
    display: block;
    position: fixed;
    z-index: 50;
    bottom: 2rem;
    left: 2rem;
    right: 2rem;
    max-width: 54rem;
    max-height: 32rem;
    overflow-x: auto;
    border-radius: 1rem;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};

    @media (min-width: ${variables.SCREEN_SIZE.LG}) {
        left: 18rem;
    }

    @media (min-width: 90rem) {
        left: calc(50% - 27rem);
    }
`;

export const ApiPlayground = ({ method }: ApiPlaygroundProps) => {
    const actions = useActions({
        ...routerActions,
    });
    useEffect(() => {
        actions.onLocationChange({ pathname: method, search: window.location.search });
    }, [actions, method]);

    return (
        <ApiPlaygroundWrapper>
            <CollapsibleBox heading="Method testing tool" variant="large">
                <Method />
            </CollapsibleBox>
        </ApiPlaygroundWrapper>
    );
};
