import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { Select, Link } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

import { goToSubStep, goToNextStep, goToPreviousStep } from '@onboarding-actions/onboardingActions';

import { Loaders, Text, OnboardingButton, Wrapper } from '@onboarding-components';
import { AppState } from '@suite-types';

const PageWrapper = styled.div``;

const SelectWrapper = styled(Select)`
    margin-right: 10px;
    width: 180px;
`;

const Download = styled.div`
    margin: 24px auto;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
`;
interface Installer {
    label: string;
    value: string;
    signature?: string;
    preferred?: boolean;
}

interface BridgeState {
    target: Installer;
    uri: string;
    installers: Installer[];
}

interface Props {
    transport: AppState['suite']['transport'];
    activeSubStep: AppState['onboarding']['activeSubStep'];
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
        goToSubStep: typeof goToSubStep;
        goToPreviousStep: typeof goToPreviousStep;
    };
}

// todo: I am not refactoring it now, so issue created https://github.com/trezor/trezor-suite/issues/1634

class InstallBridge extends PureComponent<Props, BridgeState> {
    constructor(props: Props) {
        super(props);
        const installers = this.getInstallers();
        this.state = {
            target: installers.find((i: Installer) => i.preferred === true) || installers[0],
            uri: 'https://data.trezor.io/', // todo: urls
            installers,
        };
    }

    onChange(value: Installer) {
        this.setState({
            target: value,
        });
    }

    getStatus() {
        if (this.props.transport?.type === 'bridge') {
            return 'installed';
        }
        return this.props.activeSubStep;
    }

    getInstallers(): Installer[] {
        const { transport } = this.props;
        return transport && transport.bridge
            ? transport.bridge.packages.map(p => ({
                  label: p.name,
                  value: p.url,
                  signature: p.signature,
                  preferred: p.preferred,
              }))
            : [];
    }

    download() {
        this.props.onboardingActions.goToSubStep('downloading');
    }

    render() {
        if (!this.props.transport) return null;

        const { target, uri, installers } = this.state;
        const status = this.getStatus();
        return (
            // this wrapper is just to be able to have data-test attribute
            <PageWrapper data-test="@onboarding/bridge">
                <Text size="small">
                    {status === 'installed' && (
                        <Translation
                            id="TR_TREZOR_BRIDGE_IS_RUNNING_VERSION"
                            values={{ version: this.props.transport!.version }}
                        />
                    )}
                    {status !== 'installed' && <Translation id="TR_TREZOR_BRIDGE_IS_NOT_RUNNING" />}
                </Text>

                <Text>
                    <Translation id="TR_BRIDGE_SUBHEADING" />
                </Text>

                {status === null && (
                    <Download>
                        <SelectWrapper
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            onChange={(v: Installer) => this.onChange(v)}
                            options={installers}
                        />
                        <Link href={`${uri}${target.value}`}>
                            <OnboardingButton.Cta onClick={() => this.download()}>
                                <Translation id="TR_DOWNLOAD" />
                            </OnboardingButton.Cta>
                        </Link>
                    </Download>
                )}

                {status === 'downloading' && (
                    <>
                        <Text>1.</Text>
                        <Text>
                            <Translation id="TR_WAIT_FOR_FILE_TO_DOWNLOAD" />
                        </Text>
                        {target.signature && (
                            <Text>
                                <Link href={uri + target.signature}>
                                    <Translation id="TR_CHECK_PGP_SIGNATURE" />
                                </Link>
                            </Text>
                        )}
                        <Text>2.</Text>
                        <Text>
                            <Translation id="TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER" />
                        </Text>
                        <Text>3.</Text>
                        <Text>
                            <Translation id="TR_DETECTING_BRIDGE" />
                            <Loaders.Dots maxCount={3} />
                        </Text>
                    </>
                )}

                {status === 'installed' && (
                    <>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => this.props.onboardingActions.goToNextStep()}
                            >
                                <Translation id="TR_CONTINUE" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </PageWrapper>
        );
    }
}

export default InstallBridge;
