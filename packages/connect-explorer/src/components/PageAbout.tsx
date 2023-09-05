import { useDocs } from '../hooks/useDocs';

export const About = () => {
    const docs = useDocs(
        'https://raw.githubusercontent.com/trezor/trezor-suite/develop/docs/packages/connect/index.md',
    );

    return (
        <section>
            <div dangerouslySetInnerHTML={{ __html: docs! }} className="docs-container" />
        </section>
    );
};
