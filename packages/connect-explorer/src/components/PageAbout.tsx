/* eslint-disable react/no-danger */
import { useDocs } from '../hooks/useDocs';

export const About = () => {
    const docs = useDocs('./docs/index.md');

    return (
        <section>
            <div dangerouslySetInnerHTML={{ __html: docs! }} className="docs-container" />
        </section>
    );
};
