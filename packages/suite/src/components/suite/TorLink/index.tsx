import React, { useMemo } from 'react';
import { Link, LinkProps } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { toTorUrl } from '@suite-utils/tor';

const TorLink = (props: LinkProps) => {
    const isTor = useSelector(state => state.suite.tor);
    const url = useMemo(() => {
        if (!props.href || !isTor) {
            return props.href;
        }

        return toTorUrl(props.href);
    }, [isTor, props.href]);

    return <Link {...props} href={url} />;
};

export default TorLink;
