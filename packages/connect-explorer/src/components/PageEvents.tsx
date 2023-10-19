/* eslint-disable react/no-danger */
import { useDocs } from '../hooks/useDocs';

export const Events = () => {
    const docs = useDocs(
        'https://raw.githubusercontent.com/trezor/trezor-suite/develop/docs/packages/connect/events.md',
    );

    return (
        <section>
            <div dangerouslySetInnerHTML={{ __html: docs! }} className="docs-container" />
        </section>
    );
};
