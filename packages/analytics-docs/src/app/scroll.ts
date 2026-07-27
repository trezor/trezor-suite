export type ScrollToIdInContainerArgs = {
    container: HTMLDivElement | null;
    id: string;
    behavior?: ScrollBehavior;
    offsetTop?: number;
};

export const scrollToIdInContainer = ({
    container,
    id,
    behavior = 'instant',
    offsetTop = 20,
}: ScrollToIdInContainerArgs): boolean => {
    const el = document.getElementById(id);
    if (!container || !el) return false;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const nextTop = elRect.top - containerRect.top + container.scrollTop - offsetTop;
    container.scrollTo({ top: Math.max(0, nextTop), behavior });

    return true;
};
