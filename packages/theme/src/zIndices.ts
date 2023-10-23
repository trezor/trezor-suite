// NOTE: `zIndex` values are defined as lower boundaries of a size 10 interval. For example,
// modals should have `zIndex` in interval [1040; 1050).

export const zIndices = {
    tooltip: 60, // above all content to be always fully visible when toggled
    guide: 50, // above MODAL to stay accessible when modal is open
    guideButton: 49, // below GUIDE to get covered by the guide when it is opening
    modal: 40, // above other suite content to disable interating with it
    navigationBar: 30,
    discoveryProgress: 29, // below NAVIGATION_BAR to stay below notifications
    expandableNavigationHeader: 21, // above EXPANDABLE_NAVIGATION to cover its box-shadow
    expandableNavigation: 20, // above PAGE_HEADER to spread over it
    pageHeader: 11, // above STICKY_BAR to hide it when the page is on top
    stickyBar: 10, // above page content to scroll over it
    secondaryStickyBar: 9, // below STICKY_BAR so that it can hide beneath it when no longer needed
    onboardingForeground: 2, // for handling multiple layers on the onboarding page
    base: 1, // above static content to be fully visible
} as const;

export type ZIndex = keyof typeof zIndices;

export type ZIndices = typeof zIndices;
