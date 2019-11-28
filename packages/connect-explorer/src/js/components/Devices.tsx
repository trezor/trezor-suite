import React from 'react';

const Devices: React.FC = (props: any) => {
    const { devices, selectedDevice } = props.connect;
    const deviceList: any[] = devices.map(dev => {
        let css = '';
        if (dev.unacquired) {
            css += 'unacquired';
        }
        if (dev.isUsedElsewhere) {
            css += ' used-elsewhere';
        }
        if (dev.featuresNeedsReload) {
            css += ' reload-features';
        }
        if (dev.path === selectedDevice) {
            css += ' active';
        }
        return (
            <li key={dev} className={css} onClick={() => props.onSelectDevice(dev.path)}>
                {dev.label}
            </li>
        );
    });
    if (deviceList.length === 0) {
        deviceList.push(<li key={0}>No connected devices</li>);
    }
    return (
        <nav>
            <div className="layout-wrapper">
                <ul>{deviceList}</ul>
            </div>
        </nav>
    );
};

export default Devices;
