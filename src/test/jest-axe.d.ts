/**
 * jest-axe ships no type declarations, and the accessibility spec is the only
 * thing that uses it. This declares just the part that spec calls: axe's own
 * matcher is shaped for Jest's expect and does not register against Vitest's, so
 * the spec reads `violations` off the result instead.
 */
declare module 'jest-axe' {
  interface Violation {
    /** The axe rule that failed, e.g. `button-name`. */
    id: string;
    /** One line explaining what the rule wanted. */
    help: string;
    nodes: unknown[];
  }

  interface Results {
    violations: Violation[];
  }

  export const axe: (context: Element | string) => Promise<Results>;
}
