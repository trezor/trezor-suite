import React from 'react';
import PropTypes from 'prop-types';
import { H2 } from 'components/Heading';

const DisconnectDevice = ({ label }) => (
    <main>
        <H2 claim>The private bank in your hands.</H2>
        <p>TREZOR Wallet is an easy-to-use interface for your TREZOR.</p>
        <p>TREZOR Wallet allows you to easily control your funds, manage your balance and initiate transfers.</p>
        <div className="row">
            <p className="connect">
                <span>
                        Unplug { label } device.
                </span>
            </p>
        </div>
        <div className="image" />
    </main>
);

DisconnectDevice.propTypes = {
    label: PropTypes.string.isRequired,
};

export default DisconnectDevice;