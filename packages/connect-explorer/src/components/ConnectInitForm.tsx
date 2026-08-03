import { useEffect, useRef, useState } from 'react';

import { CopyToClipboard } from 'nextra/components';
import styled from 'styled-components';

import {
    Banner,
    Button,
    Checkbox,
    CollapsibleBox,
    Icon,
    Input,
    Select,
    Text,
    variables,
} from '@trezor/components';
import type { CoinSymbol, PermissionRequest } from '@trezor/connect-common';
import { CheckIcon, FadersIcon, LightningIcon } from '@trezor/icons';

import * as trezorConnectActions from '../actions/trezorConnectActions';
import { allCoinsSelect } from '../constants/coins';
import { useActions, useSelector } from '../hooks';
import { RequestedPermissions } from './RequestedPermissions';
import type { ConnectOptions } from '../types/actions';

type CoreMode = 'auto' | 'deeplink' | 'suite-desktop' | 'suite-web';

const CORE_MODE_OPTIONS: { value: CoreMode; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'deeplink', label: 'Deeplink (mobile)' },
    { value: 'suite-desktop', label: 'Suite desktop' },
    { value: 'suite-web', label: 'Suite web' },
];

const DEFAULT_MANIFEST = {
    email: 'info@trezor.io',
    appName: 'Trezor Connect Explorer',
    appUrl: '@trezor/connect-explorer',
    appIcon: 'https://trezor.io/favicon/apple-touch-icon.png',
};

// The allCoinsSelect list infers `value` as a widened string for its inline entries; re-narrow to
// CoinSymbol so the enabledNetworks selection stays typed.
const NETWORK_OPTIONS: { value: CoinSymbol; label: string }[] = allCoinsSelect.map(coin => ({
    value: coin.value as CoinSymbol,
    label: coin.label,
}));

const getDefaultCoreMode = (): CoreMode => {
    if (typeof window === 'undefined') return 'auto';
    const fromUrl = new URLSearchParams(window.location.search).get('core-mode');

    return CORE_MODE_OPTIONS.some(o => o.value === fromUrl) ? (fromUrl as CoreMode) : 'auto';
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const HeaderIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    flex-shrink: 0;
    background: ${({ theme }) => theme.elementFillBrandSoft};
`;

const HeaderText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const Fields = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const ManifestGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: 1fr;
    }
`;

const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Chips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const Chip = styled.button<{ $active: boolean }>`
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 20px;
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    font-weight: 500;
    transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    border: 1px solid ${({ theme, $active }) => ($active ? theme.borderBrand : theme.borderNeutral)};
    background: ${({ theme, $active }) => ($active ? theme.elementFillBrandSoft : 'transparent')};
    color: ${({ theme, $active }) => ($active ? theme.contentBrand : theme.contentPrimary)};

    &:hover {
        border-color: ${({ theme }) => theme.borderBrand};
    }
`;

const SubmitRow = styled.div`
    display: flex;
    width: 100%;
`;

// Mirrors the "Method with params" code panel in the method testing tool so developers see the
// TrezorConnect.init call the button runs with their options.
const CodeBlock = styled.div`
    position: relative;
    background: ${({ theme }) => theme.elementFillField};
    border-radius: 12px;
    padding: 12px 16px;
    overflow-x: auto;

    pre {
        margin: 0;
        width: 100%;
        overflow-x: auto;
    }
`;

const CopyWrapper = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s;

    div:hover > & {
        opacity: 1;
    }
`;

export const ConnectInitForm = () => {
    const isInitializing = useSelector(state => state.connect?.isInitializing ?? false);
    const isInitSuccess = useSelector(state => state.connect?.isInitSuccess ?? false);
    const initError = useSelector(state => state.connect?.initError);

    const actions = useActions({ initWithOptions: trezorConnectActions.initWithOptions });

    // Default to 'auto' for the first render so SSG output matches client hydration, then pick up
    // the ?core-mode= URL override once mounted.
    const [coreMode, setCoreMode] = useState<CoreMode>('auto');
    useEffect(() => {
        setCoreMode(getDefaultCoreMode());
    }, []);

    const [email, setEmail] = useState(DEFAULT_MANIFEST.email);
    const [appName, setAppName] = useState(DEFAULT_MANIFEST.appName);
    const [appUrl, setAppUrl] = useState(DEFAULT_MANIFEST.appUrl);
    const [appIcon, setAppIcon] = useState(DEFAULT_MANIFEST.appIcon);
    const [debug, setDebug] = useState(true);
    const [enabledCoins, setEnabledCoins] = useState<CoinSymbol[]>([]);
    const [requestedPermissions, setRequestedPermissions] = useState<PermissionRequest[]>([]);

    // Transient confirmation shown on the button after a user-triggered (re-)init completes. Without
    // it a re-init is invisible: it is near-instant and neither the success banner nor the status dot
    // change (Connect was already initialized), so the click seems to do nothing.
    const [justInitialized, setJustInitialized] = useState(false);
    const confirmationTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(confirmationTimeout.current), []);

    const toggleCoin = (coin: CoinSymbol) =>
        setEnabledCoins(prev =>
            prev.includes(coin) ? prev.filter(c => c !== coin) : [...prev, coin],
        );

    // Rebuilt every render from the current form state so the code preview and the init call stay in
    // sync. Core mode 'deeplink' lives on the ConnectMobileSettings branch of the ConnectOptions union,
    // where the extra fields (debug, enabledNetworks) are dropped; init() bridges both branches, so
    // cast once here instead of branching the whole form on core mode.
    const options = {
        coreMode,
        manifest: {
            email,
            appName,
            appUrl,
            ...(appIcon ? { appIcon } : {}),
        },
        debug,
        ...(enabledCoins.length ? { enabledNetworks: enabledCoins.map(coin => ({ coin })) } : {}),
        ...(requestedPermissions.length ? { requestedPermissions } : {}),
    } as ConnectOptions;

    // Deeplink core mode runs through TrezorConnectMobile; everything else through TrezorConnect.
    const initFn = coreMode === 'deeplink' ? 'TrezorConnectMobile.init' : 'TrezorConnect.init';
    const initCode = `${initFn}(${JSON.stringify(options, null, 2)});`;

    const handleInit = async () => {
        setJustInitialized(false);
        const initialized = await actions.initWithOptions(options);
        if (!initialized) return;

        setJustInitialized(true);
        clearTimeout(confirmationTimeout.current);
        confirmationTimeout.current = setTimeout(() => setJustInitialized(false), 2500);
    };

    const getButtonLabel = () => {
        if (justInitialized) return 'Initialized';
        if (isInitSuccess) return 'Re-initialize Trezor Connect';

        return 'Initialize Trezor Connect';
    };

    const advancedOptions = (
        <Fields>
            <Select
                label="Core mode"
                data-testid="@init/core-mode"
                value={CORE_MODE_OPTIONS.find(o => o.value === coreMode)}
                onChange={option => setCoreMode(option.value as CoreMode)}
                options={CORE_MODE_OPTIONS}
                isSearchable={false}
            />

            <FieldGroup>
                <Text typographyStyle="body-sm-strong">Manifest</Text>
                <ManifestGrid>
                    <Input
                        label="Email"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                    />
                    <Input
                        label="App name"
                        value={appName}
                        onChange={event => setAppName(event.target.value)}
                    />
                    <Input
                        label="App URL"
                        value={appUrl}
                        onChange={event => setAppUrl(event.target.value)}
                    />
                    <Input
                        label="App icon URL"
                        value={appIcon}
                        onChange={event => setAppIcon(event.target.value)}
                    />
                </ManifestGrid>
            </FieldGroup>

            <FieldGroup>
                <Text typographyStyle="body-sm-strong">Enabled networks</Text>
                <Text typographyStyle="body-xs" color="contentSecondary">
                    Networks the host enables up front. Leave empty to use Connect defaults.
                </Text>
                <Chips>
                    {NETWORK_OPTIONS.map(coin => (
                        <Chip
                            key={coin.value}
                            type="button"
                            $active={enabledCoins.includes(coin.value)}
                            aria-pressed={enabledCoins.includes(coin.value)}
                            onClick={() => toggleCoin(coin.value)}
                            data-testid={`@init/network/${coin.value}`}
                        >
                            {coin.label}
                        </Chip>
                    ))}
                </Chips>
            </FieldGroup>

            <Checkbox isChecked={debug} onChange={() => setDebug(prev => !prev)}>
                Debug logging
            </Checkbox>

            <RequestedPermissions
                value={requestedPermissions}
                onChange={setRequestedPermissions}
                isDeeplink={coreMode === 'deeplink'}
            />
        </Fields>
    );

    return (
        <Wrapper>
            <Header>
                <HeaderIcon>
                    <Icon as={LightningIcon} size={20} color="contentBrand" />
                </HeaderIcon>
                <HeaderText>
                    <Text typographyStyle="body-md-strong">Trezor Connect initialization</Text>
                    <Text typographyStyle="body-sm" color="contentSecondary">
                        Every app calls <code>TrezorConnect.init()</code> once before using any
                        method. The explorer does it for you with sensible defaults — tweak the
                        options here and re-initialize. The call for your options is previewed below
                        (init also injects a few internal defaults).
                    </Text>
                </HeaderText>
            </Header>

            <CodeBlock data-testid="@init/code">
                <Text typographyStyle="body-sm-strong">Init with params</Text>
                <CopyWrapper>
                    <CopyToClipboard getValue={() => initCode} />
                </CopyWrapper>
                <pre>{initCode}</pre>
            </CodeBlock>

            {isInitSuccess && (
                <Banner
                    intent="info"
                    icon={CheckIcon}
                    data-testid="@init/success"
                    description="Trezor Connect is initialized. Change the options below and re-initialize any time."
                />
            )}

            <CollapsibleBox
                heading="Manifest & advanced options"
                subHeading="Core mode, manifest, enabled networks and logging"
                paddingType="none"
                fillType="none"
                toggleIcon={FadersIcon}
                defaultIsOpen
            >
                {advancedOptions}
            </CollapsibleBox>

            {initError && (
                <Banner
                    intent="critical"
                    icon
                    data-testid="@init/error"
                    description={`Init error: ${initError}`}
                />
            )}

            <SubmitRow>
                <Button
                    data-testid="@init/submit-button"
                    onClick={handleInit}
                    isLoading={isInitializing}
                    iconLeft={justInitialized ? CheckIcon : LightningIcon}
                    flex="1"
                >
                    {getButtonLabel()}
                </Button>
            </SubmitRow>
        </Wrapper>
    );
};
