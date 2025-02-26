import { Context, selectContextMessageContent } from '@suite-common/message-system';
import { Banner, Row } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLanguage, selectTorState } from 'src/reducers/suite/suiteReducer';
import { getTorUrlIfAvailable } from 'src/utils/suite/tor';

type ContextMessageProps = {
    context: (typeof Context)[keyof typeof Context];
};

export const ContextMessage = ({ context }: ContextMessageProps) => {
    const language = useSelector(selectLanguage);
    const message = useSelector(state => selectContextMessageContent(state, context, language));
    const { isTorEnabled } = useSelector(selectTorState);
    const torOnionLinks = useSelector(state => state.suite.settings.torOnionLinks);
    const dispatch = useDispatch();

    if (!message) return null;

    const onCallToAction = ({ action, link, anchor }: NonNullable<(typeof message)['cta']>) => {
        switch (action) {
            case 'internal-link':
                // @ts-expect-error: impossible to add all href options to the message system config json schema
                return () => dispatch(goto(link, { anchor, preserveParams: true }));
            case 'external-link':
                return () =>
                    window.open(
                        isTorEnabled && torOnionLinks ? getTorUrlIfAvailable(link) : link,
                        '_blank',
                    );
        }
    };

    return (
        <Banner
            variant={message.variant === 'critical' ? 'destructive' : message.variant}
            rightContent={
                message.cta && (
                    <Row gap={8}>
                        <Banner.Button
                            onClick={onCallToAction(message.cta)}
                            data-testid={`@context-message/${context}/cta`}
                        >
                            {message.cta.label}
                        </Banner.Button>
                    </Row>
                )
            }
        >
            {message.content}
        </Banner>
    );
};
