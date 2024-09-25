import React, { useEffect, useState } from 'react';

import styled from 'styled-components';
import { Object, type TSchema } from '@sinclair/typebox';

import { CollapsibleBox, Select, Switch, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { Method, MethodContent } from './Method';
import { useActions, useSelector } from '../hooks';
import * as methodActions from '../actions/methodActions';
import { MethodState } from '../reducers/methodCommon';

const ApiPlaygroundWrapper = styled.div`
    display: block;
    position: fixed;
    z-index: 10;
    bottom: 1rem;
    left: 2rem;
    right: 2rem;
    max-width: 71rem;
    overflow: hidden;
    overscroll-behavior: contain;
    border-radius: 1rem;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};

    @media (min-width: ${variables.SCREEN_SIZE.LG}) {
        left: 18rem;
    }

    @media (min-width: 90rem) {
        left: calc(50% - 27rem);
    }

    /* @media (min-width: 160rem) {
        left: calc(50% + 29rem);
    } */
`;

const ContentWrapper = styled.div`
    overflow: hidden scroll;
    max-height: calc(100vh - 300px);
`;

const OptionsRow = styled(MethodContent)`
    margin-top: -${spacingsPx.sm};
    margin-bottom: ${spacingsPx.md};
    align-items: center;

    > div:last-child {
        display: flex;
        justify-content: flex-end;
    }
`;

const SelectWrapper = styled.div`
    /* stylelint-disable selector-class-pattern, no-descending-specificity */
    .react-select__control,
    .react-select__control:read-only:not(:disabled) {
        background: transparent;
        border-style: solid;
        border-color: ${({ theme }) => theme.borderElevation1};

        &:hover {
            border-color: ${({ theme }) => theme.borderElevation2};
        }
    }
`;

interface ApiPlaygroundProps {
    options: (
        | {
              title: string;
              schema?: TSchema;
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
    const { method } = useSelector(state => ({
        method: state.method,
    }));
    const actions = useActions({
        onSetSchema: methodActions.onSetSchema,
        onSetMethod: methodActions.onSetMethod,
        onSetManualMode: methodActions.onSetManualMode,
    });

    const { manualMode } = method;

    useEffect(() => {
        const option = options[selectedOption];
        if ('legacyConfig' in option) {
            actions.onSetMethod(option.legacyConfig);
        } else {
            const { method, schema } = option;
            actions.onSetSchema(method, schema ?? Object({}));
        }
    }, [actions, options, selectedOption]);
    useEffect(() => {
        // Get default index from URL search params
        const urlParams = new URLSearchParams(window.location.search);
        const subMethodTitle = urlParams.get('submethod');
        if (subMethodTitle) {
            // Find option that contains submethod title
            const index = options.findIndex(option =>
                option.title.toLowerCase().includes(subMethodTitle.toLowerCase()),
            );
            if (index >= 0) {
                setSelectedOption(index);
            }
        }
    }, [options]);

    return (
        <ApiPlaygroundWrapper>
            <CollapsibleBox
                heading="Method testing tool"
                paddingType="large"
                data-testid="@api-playground/collapsible-box"
            >
                <ContentWrapper>
                    <OptionsRow $manualMode={manualMode}>
                        <div>
                            {options.length > 1 && (
                                <SelectWrapper>
                                    <Select
                                        label="Select method"
                                        value={{
                                            value: selectedOption,
                                            label: options[selectedOption].title,
                                        }}
                                        onChange={option => setSelectedOption(option.value)}
                                        options={options.map((option, index) => ({
                                            value: index,
                                            label: option.title,
                                        }))}
                                    />
                                </SelectWrapper>
                            )}
                        </div>
                        <div>
                            <Switch
                                label="Manual mode"
                                isChecked={!!manualMode}
                                onChange={checked => actions.onSetManualMode(!!checked)}
                            />
                        </div>
                    </OptionsRow>
                    <Method />
                </ContentWrapper>
            </CollapsibleBox>
        </ApiPlaygroundWrapper>
    );
};
