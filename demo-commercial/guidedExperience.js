export const GUIDED_CHAPTERS = Object.freeze([
  'The stakes',
  'Signal convergence',
  'Judgment',
  'Decision and authority',
  'Governed decision'
]);

export function createGuidedState() {
  return { mode: 'guided', chapter: 0, approvalStep: 'review', planOpen: false, doorsTransitioning: false };
}

export function advanceChapter(state) {
  state.chapter = Math.min(state.chapter + 1, GUIDED_CHAPTERS.length - 1);
  return state.chapter;
}

export function previousChapter(state) {
  state.chapter = Math.max(state.chapter - 1, 0);
  return state.chapter;
}
