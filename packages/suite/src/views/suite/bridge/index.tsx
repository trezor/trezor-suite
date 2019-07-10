import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Button, Select, P, Link, H1, icons, colors, variables } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';
import { AppState } from '@suite-types/index';
import l10nMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 24px;
    flex: 1;
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 500px;
    text-align: center;
    flex: 1;
    padding-top: 30px;
`;

const Bottom = styled.div`
    padding-bottom: 20px;
`;

const TitleHeader = styled(H1)`
    display: flex;
    font-size: ${variables.FONT_SIZE.HUGE};
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
`;

const Version = styled.span`
    color: ${colors.GREEN_PRIMARY};
    padding: 6px 10px;
    border: 1px solid ${colors.GREEN_PRIMARY};
    border-radius: 3px;
    font-size: ${variables.FONT_SIZE.BASE};
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    margin-left: 24px;
`;

const LearnMoreText = styled.span`
    margin-right: 4px;
`;

const SelectWrapper = styled(Select)`
    margin-right: 10px;
    width: 180px;
    margin-bottom: 5px;
`;

const Download = styled.div`
    margin: 24px auto;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
`;

const DownloadBridgeButton = styled(Button)``;

const GoBack = styled.span`
    color: ${colors.GREEN_PRIMARY};
    text-decoration: underline;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
        cursor: pointer;
        text-decoration: none;
    }
`;

interface BridgeProps {
    transport: AppState['suite']['transport'];
}

interface Installer {
    label: string;
    value: string;
    signature: string;
    preferred: boolean;
}

interface BridgeState {
    target: Installer;
    uri: string;
    currentVersion: string;
    latestVersion: string;
    installers: Installer[];
}

class InstallBridge extends PureComponent<BridgeProps, BridgeState> {
    constructor(props: BridgeProps) {
        super(props);

        // todo: typescript any. use type from connect?
        const installers = props.transport!.bridge.packages.map((p: any) => ({
            label: p.name,
            value: p.url,
            signature: p.signature,
            preferred: p.preferred,
        }));

        const currentTarget = installers.find((i: Installer) => i.preferred === true);
        this.state = {
            currentVersion:
                props.transport!.type && props.transport!.type === 'bridge'
                    ? `Your version ${props.transport!.version}`
                    : 'Not installed',
            latestVersion: props.transport!.bridge.version.join('.'),
            installers,
            target: currentTarget || installers[0],
            uri: 'https://data.trezor.io/',
        };
    }

    onChange(value: Installer) {
        this.setState({
            target: value,
        });
    }

    render() {
        const { target } = this.state;
        return (
            <Wrapper>
                <Top>
                    <TitleHeader>
                        Trezor Bridge<Version>{this.state.currentVersion}</Version>
                    </TitleHeader>
                    <P>
                        <FormattedMessage {...l10nMessages.TR_NEW_COMMUNICATION_TOOL} />
                    </P>
                    <Download>
                        <SelectWrapper
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            onChange={(v: Installer) => this.onChange(v)}
                            options={this.state.installers}
                        />
                        <Link href={`${this.state.uri}${target.value}`}>
                            <DownloadBridgeButton icon={icons.DOWNLOAD}>
                                <FormattedMessage
                                    {...l10nMessages.TR_DOWNLOAD_LATEST_BRIDGE}
                                    values={{ version: this.state.latestVersion }}
                                />
                            </DownloadBridgeButton>
                        </Link>
                    </Download>
                    <P size="small">
                        <LearnMoreText>
                            <FormattedMessage
                                {...l10nMessages.TR_LEARN_MORE_ABOUT_LATEST_VERSION}
                                values={{
                                    TR_CHANGELOG: (
                                        <Link
                                            href="https://github.com/trezor/trezord-go/blob/master/CHANGELOG.md"
                                            isGreen
                                        >
                                            <FormattedMessage {...l10nMessages.TR_CHANGELOG} />
                                        </Link>
                                    ),
                                }}
                            />
                        </LearnMoreText>
                    </P>
                    <P>
                        {target.signature && (
                            <Link href={this.state.uri + target.signature} isGreen>
                                <FormattedMessage {...l10nMessages.TR_CHECK_PGP_SIGNATURE} />
                            </Link>
                        )}
                    </P>
                </Top>
                <Bottom>
                    {this.props!.transport!.type && (
                        <P>
                            <FormattedMessage {...l10nMessages.TR_DONT_UPGRADE_BRIDGE} />
                            <br />
                            <GoBack onClick={() => goto('/wallet')}>
                                <FormattedMessage {...l10nMessages.TR_TAKE_ME_BACK_TO_WALLET} />
                            </GoBack>
                        </P>
                    )}
                </Bottom>
            </Wrapper>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
    }),
)(InstallBridge);
