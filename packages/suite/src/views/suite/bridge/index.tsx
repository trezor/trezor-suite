import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Button, Select, P, Link, H1, colors, variables, Loader } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';
import { AppState } from '@suite-types/index';
import l10nMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px 30px 24px;
    flex: 1;
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
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

const CenteredLoader = styled(Loader)`
    margin: 0 auto;
`;

const LoaderWrapper = styled.div`
    margin: 24px;
    align-items: center;
    justify-items: center;
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
    target: Installer | null;
}

class InstallBridge extends Component<BridgeProps, BridgeState> {
    constructor(props: BridgeProps) {
        super(props);
        this.state = {
            target: null,
        };
    }

    onChange(value: Installer) {
        this.setState({
            target: value,
        });
    }

    render() {
        let installers = null;
        let data = null;
        if (this.props.transport) {
            // todo: typescript any. use type from connect?
            installers = this.props.transport.bridge.packages.map((p: any) => ({
                label: p.name,
                value: p.url,
                signature: p.signature,
                preferred: p.preferred,
            }));

            const currentTarget = installers.find((i: Installer) => i.preferred === true);
            data = {
                currentVersion:
                    this.props.transport!.type && this.props.transport!.type === 'bridge'
                        ? `Your version ${this.props.transport!.version}`
                        : 'Not installed',
                latestVersion: this.props.transport!.bridge.version.join('.'),
                installers,
                target: currentTarget || installers[0],
                uri: 'https://wallet.trezor.io/data/',
            };
        } else {
            return (
                <Wrapper>
                    <Top>
                        <TitleHeader>
                            Trezor Bridge <Version>Not installed</Version>
                        </TitleHeader>
                        <P>
                            <FormattedMessage {...l10nMessages.TR_NEW_COMMUNICATION_TOOL} />
                        </P>


                        <LoaderWrapper>
                            <CenteredLoader size={50} strokeWidth={2} />
                            <P>Gathering information, please wait...</P>
                        </LoaderWrapper>
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
                    </Top>
                </Wrapper>
            );
        }

        const target = this.state.target || data.target;
        return (
            <Wrapper>
                <Top>
                    <TitleHeader>
                        Trezor Bridge<Version>{data && data.currentVersion}</Version>
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
                            options={installers}
                        />

                        {data && target ? (
                            <Link href={`${data.uri}${target.value}`}>
                                <DownloadBridgeButton icon="DOWNLOAD">
                                    <FormattedMessage
                                        {...l10nMessages.TR_DOWNLOAD_LATEST_BRIDGE}
                                        values={{ version: data.latestVersion }}
                                    />
                                </DownloadBridgeButton>
                            </Link>
                        ) : (
                                <DownloadBridgeButton icon="DOWNLOAD" isDisabled>
                                    <FormattedMessage
                                        {...l10nMessages.TR_DOWNLOAD_LATEST_BRIDGE}
                                        values={{ version: '' }}
                                    />
                                </DownloadBridgeButton>
                            )}
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
                        {target && data && target.signature && (
                            <Link href={data.uri + target.signature} isGreen>
                                <FormattedMessage {...l10nMessages.TR_CHECK_PGP_SIGNATURE} />
                            </Link>
                        )}
                    </P>
                </Top>
                <Bottom>
                    {this.props.transport.type && (
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
