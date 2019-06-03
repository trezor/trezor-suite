/* @flow */

import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { Select, Link, Button } from '@trezor/components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import { ConnectReducer } from '@suite/types/onboarding/connect';
import { OnboardingReducer, OnboardingActions } from '@suite/types/onboarding/onboarding';

import { Dots } from '@suite/components/onboarding/Loaders';
import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite/support/commonMessages';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import l10nMessages from './index.messages';

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

const DownloadBridgeButton = styled(Button)`
    display: flex;
    align-items: center;
`;

interface Installer {
    label: string;
    value: string;
    signature: string;
    preferred: boolean;
}

interface State {
    target: Installer;
    uri: string;
    installers: Installer[];
}

interface Props {
    transport: ConnectReducer['transport'];
    activeSubStep: OnboardingReducer['activeSubStep'];
    onboardingActions: OnboardingActions;
}

class InstallBridge extends PureComponent<Props & InjectedIntlProps, State> {
    constructor(props: Props & InjectedIntlProps) {
        super(props);
        const installers = this.getInstallers();
        this.state = {
            target: installers.find((i: Installer) => i.preferred === true) || installers[0],
            uri: 'https://data.trezor.io/',
            installers,
        };
    }

    onChange(value: Installer) {
        this.setState({
            target: value,
        });
    }

    getStatus() {
        if (this.props.transport.type === 'bridge') {
            return 'installed';
        }
        return this.props.activeSubStep;
    }

    getInstallers() {
        // todo: typescript from connect
        return this.props.transport.bridge.packages.map((p: any) => ({
            label: p.name,
            value: p.url,
            signature: p.signature,
            preferred: p.preferred,
        }));
    }

    download() {
        this.props.onboardingActions.goToSubStep('downloading');
    }

    render() {
        const { target, uri, installers } = this.state;
        const status = this.getStatus();

        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    <FormattedMessage {...l10nMessages.TR_BRIDGE_HEADING} />
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    <Text size="small">
                        {status === 'installed' && (
                            <FormattedMessage
                                {...l10nMessages.TR_TREZOR_BRIDGE_IS_RUNNING_VERSION}
                                values={{ version: this.props.transport.version }}
                            />
                        )}
                        {status !== 'installed' && (
                            <FormattedMessage {...l10nMessages.TR_TREZOR_BRIDGE_IS_NOT_RUNNING} />
                        )}
                    </Text>

                    <Text>
                        <FormattedMessage {...l10nMessages.TR_BRIDGE_SUBHEADING} />
                    </Text>

                    {status === null && (
                        <React.Fragment>
                            <Download>
                                <SelectWrapper
                                    isSearchable={false}
                                    isClearable={false}
                                    value={target}
                                    onChange={(v: Installer) => this.onChange(v)}
                                    options={installers}
                                />
                                <Link href={`${uri}${target.value}`}>
                                    <DownloadBridgeButton onClick={() => this.download()}>
                                        <FormattedMessage {...l10nMessages.TR_DOWNLOAD} />
                                    </DownloadBridgeButton>
                                </Link>
                            </Download>
                        </React.Fragment>
                    )}

                    {status === 'downloading' && (
                        <React.Fragment>
                            <Text>1.</Text>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_WAIT_FOR_FILE_TO_DOWNLOAD} />
                            </Text>
                            {target.signature && (
                                <Text>
                                    <Link href={uri + target.signature} isGreen>
                                        <FormattedMessage
                                            {...l10nMessages.TR_CHECK_PGP_SIGNATURE}
                                        />
                                    </Link>
                                </Text>
                            )}
                            <Text>2.</Text>
                            <Text>
                                <FormattedMessage
                                    {...l10nMessages.TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER}
                                />
                            </Text>
                            <Text>3.</Text>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_DETECTING_BRIDGE} />
                                <Dots maxCount={3} />
                            </Text>
                        </React.Fragment>
                    )}

                    {status === 'installed' && (
                        <React.Fragment>
                            <ControlsWrapper>
                                <Button onClick={() => this.props.onboardingActions.goToNextStep()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default injectIntl(InstallBridge);
