import { useIntl } from 'react-intl';

import { messages } from '@suite/intl';
import { SUITE_URL } from '@trezor/urls';

type MetadataProps = {
    title?: string;
    description?: string;
    url?: string;
};

/**
 * React 19 hoists `<title>` and `<meta>` into `<head>` from anywhere in the tree, see
 * https://react.dev/reference/react-dom/components/title and https://react.dev/reference/react-dom/components/meta.
 *
 * Note that the behavior with multiple mounted `<title>` is **not** defined by docs.
 * We rely on undocumented react-dom behavior, so `Metadata.test.tsx` covers it against regressions.
 */
export const Metadata = ({
    title = 'Trezor Suite',
    description,
    url = SUITE_URL,
}: MetadataProps) => {
    const intl = useIntl();
    description = description || intl.formatMessage(messages.TR_SUITE_META_DESCRIPTION);

    return (
        <>
            <title>{title}</title>
            <meta name="title" key="title" content={title} />
            <meta name="description" key="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" key="og:type" content="website" />
            <meta property="og:url" key="og:url" content={url} />
            <meta property="og:title" key="og:title" content={title} />
            <meta property="og:description" key="og:description" content={description} />
            {/* <meta property="og:image" key="og:image" content={image} />*}

            {/* Twitter */}
            <meta property="twitter:card" key="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" key="twitter:url" content={url} />
            <meta property="twitter:title" key="twitter:title" content={title} />
            <meta property="twitter:description" key="twitter:description" content={description} />
            {/* <meta property="twitter:image" key="twitter:image" content={image} /> */}
        </>
    );
};
