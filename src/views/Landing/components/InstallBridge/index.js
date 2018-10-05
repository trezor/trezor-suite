/* @flow */

import React, { Component } from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import { Select } from 'components/Select';
import Link from 'components/Link';
import Button from 'components/Button';
import Loader from 'components/Loader';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import ICONS from 'config/icons';

import type { State as TrezorConnectState } from 'reducers/TrezorConnectReducer';

type InstallTarget = {
    value: string;
    label: string;
    signature: ?string;
    preferred: boolean;
}

type State = {
    currentVersion: string;
    latestVersion: string;
    installers: Array<InstallTarget>;
    target: InstallTarget;
    uri: string;
}

type Props = {
    transport: $ElementType<TrezorConnectState, 'transport'>;
}

const InstallBridgeWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top: 0px;
    max-width: 500px;
`;

const TitleHeader = styled.h3`
    font-size: ${FONT_SIZE.BIGGEST};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
`;

const BridgeVersion = styled.span`
    color: ${colors.GREEN_PRIMARY};
    padding: 6px 10px;
    border: 1px solid ${colors.GREEN_PRIMARY};
    border-radius: 3px;
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.SMALLEST};
    margin-left: 24px;
`;

const LearnMoreText = styled.span`
    margin-right: 4px;
`;

const SelectWrapper = styled(Select)`
    margin-right: 10px;
    width: 180px;
`;

const DownloadBridgeWrapper = styled.div`
    margin: 24px auto;
    display: flex;
    align-items: center;
`;

const DownloadBridgeButton = styled(Button)`
    padding-top: 5px;
    padding-bottom: 5px;
    display: flex;
    align-items: center;
`;

export default class InstallBridge extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        const installers = props.transport.bridge.packages.map(p => ({
            label: p.name,
            value: p.url,
            signature: p.signature,
            preferred: p.preferred,
        }));

        const currentTarget: ?InstallTarget = installers.find(i => i.preferred === true);
        this.state = {
            currentVersion: props.transport.type ? `Your version ${props.transport.version}` : 'Not installed',
            latestVersion: props.transport.bridge.version.join('.'),
            installers,
            target: currentTarget || installers[0],
            uri: 'https://wallet.trezor.io/data/',
        };
    }

    onChange(value: InstallTarget) {
        this.setState({
            target: value,
        });
    }

    render() {
        const { target } = this.state;
        if (!target) {
            return <Loader text="Loading" size={100} />;
        }

        const changelog = this.props.transport.bridge.changelog.map(entry => (
            <li key={entry}>{entry}</li>
        ));
        const url = `${this.state.uri}${target.value}`;
        return (
            <InstallBridgeWrapper>
                <TitleHeader>TREZOR Bridge.<BridgeVersion>{this.state.currentVersion}</BridgeVersion></TitleHeader>
                <P>New communication tool to facilitate the connection between your TREZOR and your internet browser.</P>
                <DownloadBridgeWrapper>
                    <SelectWrapper
                        isSearchable={false}
                        isClearable={false}
                        value={target}
                        onChange={v => this.onChange(v)}
                        options={this.state.installers}
                    />
                    <Link href={url}>
                        <DownloadBridgeButton>
                            <Icon
                                icon={ICONS.DOWNLOAD}
                                color={colors.WHITE}
                                size={30}
                            />
                            Download latest Bridge {this.state.latestVersion}
                        </DownloadBridgeButton>
                    </Link>
                </DownloadBridgeWrapper>
                {target.signature && (
                    <P>
                        <Link
                            href={this.state.uri + target.signature}
                            target="_blank"
                            rel="noreferrer noopener"
                            isGreen
                        >Check PGP signature
                        </Link>
                    </P>
                )}
                <P>
                    { changelog }
                    <LearnMoreText>Learn more about latest versions in</LearnMoreText>
                    <Link
                        href="https://github.com/trezor/trezord-go/blob/master/CHANGELOG.md"
                        target="_blank"
                        rel="noreferrer noopener"
                        isGreen
                    >Changelog
                    </Link>
                </P>
                {this.props.transport.type && (
                    <React.Fragment>
                        <P>
                            No, i dont want to upgrade Bridge now,
                        </P>
                        <P>
                            Take me <Link href="#/">back to the wallet</Link>
                        </P>
                    </React.Fragment>
                )}
            </InstallBridgeWrapper>
        );
    }
}