import React from 'react';
import { Link, LinkProps } from '@trezor/components';
import { useExternalLink } from '@suite-hooks';

const TrezorLink = (props: LinkProps) => {
    const url = useExternalLink(props.href);

    return <Link {...props} href={url} />;
};

export default TrezorLink;
