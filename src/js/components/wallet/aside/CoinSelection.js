import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import navigationConstants from '~/js/constants/navigation';

class CoinSelection extends Component {
    getBaseUrl() {
        const { selectedDevice } = this.props.wallet;
        let baseUrl = '';
        if (selectedDevice && selectedDevice.features) {
            baseUrl = `/device/${selectedDevice.features.device_id}`;
            if (selectedDevice.instance) {
                baseUrl += `:${selectedDevice.instance}`;
            }
        }
        return baseUrl;
    }

    render() {
        const { config } = this.props.localStorage;
        return (
            <section>
                {config.coins.map(item => (
                    <NavLink
                        key={item.network}
                        to={`${this.getBaseUrl()}/network/${item.network}/account/0`}
                    >{ item.name }
                    </NavLink>
                ))}
                <div className="coin-divider">
                    Other coins <span>(You will be redirected)</span>
                </div>
                {navigationConstants.map(item => (
                    <a
                        key={item.coinName}
                        rel="noopener noreferrer"
                        target="_blank"
                        href={item.url}
                    >{item.coinName}
                    </a>
                ))}
            </section>
        );
    }
}

CoinSelection.propTypes = {
    config: PropTypes.object,
    wallet: PropTypes.object,
    selectedDevice: PropTypes.object,
    localStorage: PropTypes.object,
};

export default CoinSelection;