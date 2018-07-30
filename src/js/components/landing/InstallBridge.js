/* @flow */


import React, { Component } from 'react';
import Select from 'react-select';
import Preloader from './Preloader';

type State = {
    version: string;
    target: ?InstallTarget;
    url: string;
}

type InstallTarget = {
    id: string;
    value: string;
    label: string;
}

const installers: Array<InstallTarget> = [
    { id: 'Windows', value: 'trezor-bridge-2.0.11-win32-install.exe', label: 'Windows' },
    { id: 'macOS', value: 'trezor-bridge-2.0.11.pkg', label: 'Mac OS X' },
    { id: 'Linux', value: 'trezor-bridge_2.0.11_amd64.deb', label: 'Linux 64-bit (deb)' },
    { id: 'Linux-rpm', value: 'trezor-bridge_2.0.11_amd64.rpm', label: 'Linux 64-bit (rpm)' },
    { id: '01', value: 'trezor-bridge_2.0.11_amd32.deb', label: 'Linux 32-bit (deb)' },
    { id: '02', value: 'trezor-bridge_2.0.11_amd32.rpm', label: 'Linux 32-bit (rpm)' },
];

// import type { Props } from './index';

type Props = {
    browserState: {
        osname: string,
    };
}

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

    onChange(value: InstallTarget) {
        this.setState({
            target: value,
        });
    }

    componentWillUpdate() {
        if (this.props.browserState.osname && !this.state.target) {
            const currentTarget: ?InstallTarget = installers.find(i => i.id === this.props.browserState.osname);
            this.setState({
                target: currentTarget,
            });
        }
    }

    render() {
        if (!this.state.target) {
            return <Preloader />;
        }
        const label: string = this.state.target.label;
        const url = `${this.state.url}${this.state.target.value}`;

        return (
            <main>
                <h3 className="claim">TREZOR Bridge. <span>Version 2.0.12</span></h3>
                <p>New communication tool to facilitate the connection between your TREZOR and your internet browser.</p>
                <div className="row">
                    <Select
                        name="installers"
                        className="installers"
                        searchable={false}
                        clearable={false}
                        value={this.state.target}
                        onChange={this.onChange.bind(this)}
                        options={installers}
                    />
                    <a href={url} className="button">Download for { label }</a>
                </div>
                <p>Learn more about latest version in <a href="https://github.com/trezor/trezord-go/blob/master/CHANGELOG.md" className="green" target="_blank" rel="noreferrer noopener">Changelog</a></p>
            </main>
        );
    }
}