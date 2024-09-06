// NOTE: `zIndex` values are defined as lower boundaries of a size 10 interval. For example,
// modals should have `zIndex` in interval [1040; 1050).

export const zIndices = {
    windowControls: 100,
    tooltip: 60, // above all content to be always fully visible when toggled
    guide: 50, // above MODAL to stay accessible when modal is open
    guideButton: 49, // below GUIDE to get covered by the guide when it is opening

    // doesn't collide with notifications that are few pixels below
    // should be in front of modal because of switch device modal
    discoveryProgress: 41,

    modal: 40, // above other suite content to disable interacting with it
    draggableComponent: 30, // sidebar, above other content to be visible when dragged, resized
    navigationBar: 30,
    expandableNavigationHeader: 21, // above EXPANDABLE_NAVIGATION to cover its box-shadow
    expandableNavigation: 20, // above PAGE_HEADER to spread over it
    pageHeader: 11, // above STICKY_BAR to hide it when the page is on top
    stickyBar: 10, // above page content to scroll over it
    secondaryStickyBar: 9, // below STICKY_BAR so that it can hide beneath it when no longer needed
    selectMenu: 3,
    onboardingForeground: 2, // for handling multiple layers on the onboarding page
    base: 1, // above static content to be fully visible
} as const;

export type ZIndex = keyof typeof zIndices;
export type ZIndices = typeof zIndices;
export type ZIndexValues = ZIndices[ZIndex];
