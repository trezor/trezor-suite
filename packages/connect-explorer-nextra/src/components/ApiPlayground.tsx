import React, { useEffect, useState } from 'react';

import styled from 'styled-components';
import { TSchema } from '@sinclair/typebox';

import { CollapsibleBox, SelectBar, variables } from '@trezor/components';

import { Method } from './Method';
import { useActions } from '../hooks';
import * as methodActions from '../actions/methodActions';
import { MethodState } from '../reducers/methodCommon';

const ApiPlaygroundWrapper = styled.div`
    display: block;
    position: fixed;
    z-index: 10;
    bottom: 2rem;
    left: 2rem;
    right: 2rem;
    max-width: 54rem;
    max-height: 48rem;
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

const CollapsibleBoxStyled = styled(CollapsibleBox)`
    margin: 0;
    border: 0;
`;

interface ApiPlaygroundProps {
    options: (
        | {
              title: string;
              schema: TSchema;
              method: string;
          }
        | {
              title: string;
              legacyConfig: Partial<MethodState>;
          }
    )[];
}
export const ApiPlayground = ({ options }: ApiPlaygroundProps) => {
    const [selectedOption, setSelectedOption] = useState(0);
    const actions = useActions({
        onSetSchema: methodActions.onSetSchema,
        onSetMethod: methodActions.onSetMethod,
    });
    useEffect(() => {
        const option = options[selectedOption];
        if ('legacyConfig' in option) {
            actions.onSetMethod(option.legacyConfig);
        } else {
            const { method, schema } = option;
            actions.onSetSchema(method, schema);
        }
    }, [actions, options, selectedOption]);

    return (
        <ApiPlaygroundWrapper>
            <CollapsibleBoxStyled heading="Method testing tool" variant="large">
                {options.length > 1 && (
                    <div style={{ marginTop: '-12px', marginBottom: '4px' }}>
                        <SelectBar
                            selectedOption={selectedOption}
                            onChange={(index: number) => setSelectedOption(index)}
                            options={options.map((option, index) => ({
                                value: index,
                                label: option.title,
                            }))}
                        />
                    </div>
                )}
                <Method />
            </CollapsibleBoxStyled>
        </ApiPlaygroundWrapper>
    );
};
