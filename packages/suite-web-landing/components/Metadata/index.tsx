import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { URLS } from '@suite-constants';
import Head from 'next/head';
import { useTranslation } from '@suite-hooks/useTranslation';

const Metadata = () => {
    const { translationString } = useTranslation();
    const description = translationString('TR_SUITE_LANDING_META_DESCRIPTION');
    const image = `${URLS.SUITE_URL}${resolveStaticPath('images/suite-web-landing/meta.png')}`;
    return (
        <Head>
            <meta name="title" content="Trezor Suite" />
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={URLS.SUITE_URL} />
            <meta property="og:title" content="Trezor Suite" />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={URLS.SUITE_URL} />
            <meta property="twitter:title" content="Trezor Suite" />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
        </Head>
    );
};

export default Metadata;
