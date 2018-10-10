/* @flow */

import React, { Component } from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import { Select } from 'components/Select';
import Link from 'components/Link';
import { H1 } from 'components/Heading';
import Button from 'components/Button';
import Loader from 'components/Loader';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import * as RouterActions from 'actions/RouterActions';

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
    selectFirstAvailableDevice: typeof RouterActions.selectFirstAvailableDevice,
    transport: $ElementType<TrezorConnectState, 'transport'>;
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    max-width: 500px;
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 500px;
    flex: 1;
    padding-top: 30px;
`;

const Bottom = styled.div`
    padding-bottom: 20px;
`;

const TitleHeader = styled(H1)`
    display: flex;
    font-size: ${FONT_SIZE.BIGGEST};
    justify-content: center;
    align-items: center;
`;

const Version = styled.span`
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

const Download = styled.div`
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

const GoBack = styled.span`
    color: ${colors.GREEN_PRIMARY};
    text-decoration: underline;

    &:hover {
        cursor: pointer;
        text-decoration: none;
    }
`;

const Ol = styled.ul`
    margin: 0 auto;
    color: ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.BASE};
    padding: 10px 0 15px 25px;
    text-align: left;
`;

const Li = styled.li`
    text-align: justify;
`;

class InstallBridge extends Component<Props, State> {
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
            currentVersion: props.transport.type && props.transport.type === 'bridge' ? `Your version ${props.transport.version}` : 'Not installed',
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
        return (
            <Wrapper>
                <Top>
                    <TitleHeader>TREZOR Bridge<Version>{this.state.currentVersion}</Version></TitleHeader>
                    <P>New communication tool to facilitate the connection between your TREZOR and your internet browser.</P>
                    <Download>
                        <SelectWrapper
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            onChange={v => this.onChange(v)}
                            options={this.state.installers}
                        />
                        <Link href={`${this.state.uri}${target.value}`}>
                            <DownloadBridgeButton>
                                <Icon
                                    icon={ICONS.DOWNLOAD}
                                    color={colors.WHITE}
                                    size={30}
                                />
                            Download latest Bridge {this.state.latestVersion}
                            </DownloadBridgeButton>
                        </Link>
                    </Download>
                    <Ol>
                        {this.props.transport.bridge.changelog.map(entry => (
                            <Li key={entry}>{entry}</Li>
                        ))}
                    </Ol>
                    <P isSmaller>
                        <LearnMoreText>Learn more about latest versions in</LearnMoreText>
                        <Link
                            href="https://github.com/trezor/trezord-go/blob/master/CHANGELOG.md"
                            isGreen
                        >Changelog
                        </Link>
                    </P>
                    <P>
                        {target.signature && (
                            <Link
                                href={this.state.uri + target.signature}
                                isGreen
                            >Check PGP signature
                            </Link>
                        )}
                    </P>
                </Top>
                <Bottom>
                    {this.props.transport.type && (
                        <P>
                            No, i dont want to upgrade Bridge now<br />
                            Take me <GoBack onClick={() => this.props.selectFirstAvailableDevice()}>back to the wallet</GoBack>
                        </P>
                    )}
                </Bottom>
            </Wrapper>
        );
    }
}

export default InstallBridge;