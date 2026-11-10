import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { CardList } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { setView } from '#src/actions/suite/guideActions';
import { useSelector } from '#src/hooks/suite';
import { selectGuideCurrentNode } from '#src/selectors/suite/guideSelectors';
import { getNodeTitle } from '#src/utils/suite/guide';

import { GuideCategories } from './GuideCategories';
import { GuideContent } from './GuideContent';
import { GuideHeader } from './GuideHeader';
import { GuideNode } from './GuideNode';
import { GuideViewWrapper } from './GuideViewWrapper';

const Section = styled.div`
    margin-bottom: 20px;

    &:not(:last-of-type) {
        margin-bottom: 96px;
    }
`;

export const GuideCategory = () => {
    const currentNode = useSelector(selectGuideCurrentNode);
    const language = useSelector(selectLanguage);
    const { dispatch } = useServices(injectDispatch);

    if (!currentNode || currentNode.type === 'page') {
        return null;
    }

    const title = getNodeTitle(currentNode, language);

    // Right now we support only 2 levels of categories
    // Level 1 category has its own view
    // Level 2 category is part of level 1 category view
    const pages = currentNode.children.filter(child => child.type === 'page');
    const subcategories = currentNode.children.filter(child => child.type === 'category');

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={title} />
            <GuideContent>
                {pages.length ? (
                    <Section>
                        <CardList data-testid="@guide/nodes">
                            {pages.map(page => (
                                <GuideNode key={page.id} node={page} />
                            ))}
                        </CardList>
                    </Section>
                ) : null}
                {subcategories.map(subcategory => (
                    <GuideCategories
                        key={subcategory.id}
                        node={subcategory}
                        label={getNodeTitle(subcategory, language)}
                        variant="cardList"
                    />
                ))}
            </GuideContent>
        </GuideViewWrapper>
    );
};
