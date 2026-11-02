import React, { useCallback, useEffect, useState } from 'react';

import { Object, type TSchema } from '@sinclair/typebox';
import styled, { css } from 'styled-components';

import {
    CollapsibleBox,
    Dot,
    type DotIntent,
    Icon,
    Select,
    Switch,
    variables,
} from '@trezor/components';
import { GearIcon } from '@trezor/icons';

import { ConnectSettingsPanel } from './ConnectSettingsPanel';
import { Method, MethodContent } from './Method';
import * as methodActions from '../actions/methodActions';
import { useActions, useSelector } from '../hooks';
import { type MethodState } from '../reducers/methodCommon';
import { selectMethod } from '../reducers/methodReducer';
import {
    selectConnectInitError,
    selectIsConnectInitSuccess,
    selectIsConnectInitializing,
} from '../reducers/trezorConnectReducer';

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
    border-radius: 16px;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.surfaceBorderFixed};
    box-shadow: ${({ theme }) => theme.surfaceShadowFixed};

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
    margin-bottom: 16px;
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
        border-color: ${({ theme }) => theme.borderNeutral};

        &:hover {
            border-color: ${({ theme }) => theme.elementBorderFieldHovered};
        }
    }
`;

const RightControls = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

type ConnectStatus = 'ok' | 'pending' | 'error' | 'idle';

const DOT_INTENTS: Record<ConnectStatus, DotIntent> = {
    ok: 'brand',
    pending: 'warning',
    error: 'critical',
    idle: 'neutral',
};

const STATUS_LABELS: Record<ConnectStatus, string> = {
    ok: 'initialized',
    pending: 'initializing…',
    error: 'initialization error',
    idle: 'not initialized',
};

const SettingsToggle = styled.button<{ $open: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    border: 1px solid ${({ theme, $open }) => ($open ? theme.borderBrand : theme.borderNeutral)};
    background: ${({ theme, $open }) => ($open ? theme.elementFillBrandSoft : 'transparent')};
    color: ${({ theme, $open }) => ($open ? theme.contentBrand : theme.contentPrimary)};

    &:hover {
        border-color: ${({ theme }) => theme.borderBrand};
    }
`;

// Both views stay mounted and the inactive one is only hidden, so toggling the gear keeps the
// method's editor content (manual mode) and the settings form's edits instead of discarding them.
const SwitchArea = styled.div<{ $hidden: boolean }>`
    ${({ $hidden }) =>
        $hidden &&
        css`
            display: none;
        `}
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
    const [showSettings, setShowSettings] = useState(false);
    const method = useSelector(selectMethod);
    const isInitSuccess = useSelector(selectIsConnectInitSuccess);
    const isInitializing = useSelector(selectIsConnectInitializing);
    const initError = useSelector(selectConnectInitError);
    const actions = useActions({
        onSetSchema: methodActions.onSetSchema,
        onSetMethod: methodActions.onSetMethod,
        onSetManualMode: methodActions.onSetManualMode,
    });

    const { manualMode } = method;

    // Stable identity so the success screen's auto-switch timer isn't reset by re-renders (this
    // component re-renders on isInitializing for the status dot).
    const closeSettings = useCallback(() => setShowSettings(false), []);

    const getConnectStatus = (): ConnectStatus => {
        if (initError) return 'error';
        if (isInitializing) return 'pending';
        if (isInitSuccess) return 'ok';

        return 'idle';
    };
    const connectStatus = getConnectStatus();

    useEffect(() => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const option: (typeof options)[number] = options[selectedOption];
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
                            {!showSettings && options.length > 1 && (
                                <SelectWrapper>
                                    <Select
                                        label="Select method"
                                        value={{
                                            value: selectedOption,
                                            label: options[selectedOption]?.title ?? '',
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
                            <RightControls>
                                <SettingsToggle
                                    type="button"
                                    $open={showSettings}
                                    onClick={() => setShowSettings(open => !open)}
                                    data-testid="@init/settings-toggle"
                                    title={`Trezor Connect — ${STATUS_LABELS[connectStatus]}`}
                                    aria-expanded={showSettings}
                                    aria-label={`Trezor Connect settings — ${STATUS_LABELS[connectStatus]}`}
                                >
                                    <Icon
                                        as={GearIcon}
                                        size={16}
                                        color={showSettings ? 'contentBrand' : 'contentSecondary'}
                                    />
                                    Connect
                                    <Dot
                                        size={8}
                                        intent={DOT_INTENTS[connectStatus]}
                                        isAnimated={connectStatus === 'pending'}
                                    />
                                </SettingsToggle>
                                {!showSettings && (
                                    <Switch
                                        label="Manual mode"
                                        isChecked={!!manualMode}
                                        onChange={checked => actions.onSetManualMode(!!checked)}
                                    />
                                )}
                            </RightControls>
                        </div>
                    </OptionsRow>
                    <SwitchArea $hidden={showSettings}>
                        <Method />
                    </SwitchArea>
                    <SwitchArea $hidden={!showSettings}>
                        <ConnectSettingsPanel onClose={closeSettings} />
                    </SwitchArea>
                </ContentWrapper>
            </CollapsibleBox>
        </ApiPlaygroundWrapper>
    );
};
