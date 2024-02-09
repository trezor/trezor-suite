import { useDocs } from '../hooks/useDocs';

export const Events = () => {
    const docs = useDocs('./docs/events.md');

    return (
        <section>
            <div dangerouslySetInnerHTML={{ __html: docs! }} className="docs-container" />
        </section>
    );
};
