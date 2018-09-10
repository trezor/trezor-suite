/* @flow */

import React, { Component } from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import installers from 'constants/bridge';
import { Select } from 'components/Select';
import Link from 'components/Link';
import Button from 'components/Button';
import Loader from 'components/Loader';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import ICONS from 'config/icons';

type InstallTarget = {
    id: string;
    value: string;
    label: string;
}

type State = {
    version: string;
    target: ?InstallTarget;
    url: string;
}

// import type { Props } from './index';

type Props = {
    browserState: {
        osname: string,
    };
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

        const currentTarget: ?InstallTarget = installers.find(i => i.id === props.browserState.osname);
        this.state = {
            version: '2.0.12',
            url: 'https://wallet.trezor.io/data/bridge/2.0.12/',
            target: currentTarget,
        };
    }

    componentWillUpdate() {
        if (this.props.browserState.osname && !this.state.target) {
            const currentTarget: ?InstallTarget = installers.find(i => i.id === this.props.browserState.osname);
            this.setState({
                target: currentTarget,
            });
        }
    }

    onChange(value: InstallTarget) {
        console.warn(value);
        this.setState({
            target: value,
        });
    }

    render() {
        if (!this.state.target) {
            return <Loader text="Loading" size={100} />;
        }
        const { label } = this.state.target;
        const url = `${this.state.url}${this.state.target.value}`;

        return (
            <InstallBridgeWrapper>
                <TitleHeader>TREZOR Bridge.<BridgeVersion>Version {this.state.version}</BridgeVersion></TitleHeader>
                <P>New communication tool to facilitate the connection between your TREZOR and your internet browser.</P>
                <DownloadBridgeWrapper>
                    <SelectWrapper
                        isSearchable={false}
                        isClearable={false}
                        value={this.state.target}
                        onChange={val => this.onChange(val)}
                        options={installers}
                    />
                    <Link href={url}>
                        <DownloadBridgeButton>
                            <Icon
                                icon={ICONS.DOWNLOAD}
                                color={colors.WHITE}
                                size={30}
                            />
                            Download for {label}
                        </DownloadBridgeButton>
                    </Link>
                </DownloadBridgeWrapper>
                <P>
                    <LearnMoreText>Learn more about latest version in</LearnMoreText>
                    <Link
                        href="https://github.com/trezor/trezord-go/blob/master/CHANGELOG.md"
                        target="_blank"
                        rel="noreferrer noopener"
                        isGreen
                    >Changelog
                    </Link>
                </P>
            </InstallBridgeWrapper>
        );
    }
}