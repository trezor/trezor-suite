import { resolveMessageContent } from '@suite-common/message-system';
import { type CTA } from '@suite-common/suite-types';

export const canHandleCtaAction = <TCta extends Pick<CTA, 'action' | 'link' | 'label'>>(
    cta: TCta | undefined,
    language: string,
): cta is TCta => {
    if (cta?.action !== 'external-link') {
        return false;
    }

    if (!cta.link || !cta.label) {
        return false;
    }

    return !!resolveMessageContent(cta.label, language);
};
