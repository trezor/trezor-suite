import React, { useMemo } from 'react';
import { Link, LinkProps } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { toTorUrl } from '@suite-utils/tor';

const TrezorLink = (props: LinkProps) => {
    const { tor, torOnionLinks } = useSelector(state => ({
        tor: state.suite.tor,
        torOnionLinks: state.suite.settings.torOnionLinks,
    }));

    const url = useMemo(() => {
        if (props.href && tor && torOnionLinks) {
            return toTorUrl(props.href);
        }

        return props.href;
    }, [tor, torOnionLinks, props.href]);

    return <Link {...props} href={url} />;
};

export default TrezorLink;
