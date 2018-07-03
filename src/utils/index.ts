const noop = () => {};

/**
 * @description Check the environment
 */
const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export { noop, canUseDOM };
