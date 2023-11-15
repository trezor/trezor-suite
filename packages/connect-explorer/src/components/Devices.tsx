import styled from 'styled-components';
import { useActions, useSelector } from '../hooks';
import * as trezorConnectActions from '../actions/trezorConnectActions';

const Nav = styled.nav`
    width: 100%;
`;

const LayoutWrapper = styled.div`
    color: #fff;
    background: #2c2c2c;
    padding: 0;
    padding: 4px 0 6px 20px;
`;

const DeviceList = styled.ul`
    list-style: none;
`;

const DeviceItem = styled.li`
    position: relative;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    width: 25%;
    display: inline-block;

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

const Devices = () => {
    const { connect } = useSelector(state => ({
        connect: state.connect,
    }));
    const { onSelectDevice } = useActions({
        ...trezorConnectActions,
    });

    const { devices } = connect;

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
