import React from 'react';
import styled from 'styled-components';
import { useActions, useSelector } from '../hooks';
import * as trezorConnectActions from '../actions/trezorConnectActions';

const Nav = styled.nav`
    position: fixed;
    top: 50px;
    width: 100%;
    z-index: 100;
`;

const LayoutWrapper = styled.div`
    color: #fff;
    background: #2c2c2c;
    padding: 0;
`;

const DeviceList = styled.ul`
    list-style: none;
`;

const DeviceItem = styled.li`
    position: relative;
    display: block;
    cursor: pointer;
    padding: 10px 15px;
    white-space: nowrap;
    //overflow: hidden;
    width: 25%;
    display: inline-block;
    border-top: 1px solid transparent;
    border-bottom: 4px solid transparent;
    &.active {
        background: #060606;
        border-top-color: #2c2c2c;
        border-bottom-color: #4cc148;
    }

    &.unacquired {
        color: gray;
    }

    &.used-elsewhere {
        color: red !important;
    }

    &.reload-features {
        color: orange;
    }
`;
// ul {

//     li {
//         position: relative;
//         display: block;
//         cursor: pointer;
//         padding: 10px 15px;
//         white-space: nowrap;
//         //overflow: hidden;
//         width: 25%;
//         display: inline-block;
//         border-top: 1px solid transparent;
//         border-bottom: 4px solid transparent;
//         &.active {
//             background: #060606;
//             border-top-color: #2C2C2C;
//             border-bottom-color: #4cc148;
//         }

//         &.unacquired {
//             color: gray;
//         }

//         &.used-elsewhere {
//             color: red !important;
//         }

//         &.reload-features {
//             color: orange;
//         }
//     }
// }
const Devices = () => {
    const { connect } = useSelector(state => ({
        connect: state.connect,
    }));
    const { onSelectDevice } = useActions({
        ...trezorConnectActions,
    });

    const { devices, selectedDevice } = connect;

    const deviceList = devices.map(dev => (
        <DeviceItem key={dev.path} onClick={() => onSelectDevice(dev.path)}>
            {dev.label}
        </DeviceItem>
    ));

    if (deviceList.length === 0) {
        deviceList.push(<li key={0}>No connected devices</li>);
    }

    return (
        <Nav>
            <LayoutWrapper>
                <DeviceList>{deviceList}</DeviceList>
            </LayoutWrapper>
        </Nav>
    );
};

export default Devices;
