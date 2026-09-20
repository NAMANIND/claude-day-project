/** Model aliases understood by the Agent SDK: 'opus' → claude-opus-5, 'sonnet' → claude-sonnet-5. */
export const ROLE_MODEL = {
  ingest: "sonnet",
  research: "sonnet",
  validate: "opus",
  distribute: "sonnet",
  draft: "opus",
  juror: "sonnet",
  revise: "opus",
} as const;
export type Role = keyof typeof ROLE_MODEL;

export const ROLE_BUDGET_USD: Record<Role, number> = {
  ingest: 0.6,
  research: 1.2,
  validate: 0.6,
  distribute: 0.5,
  draft: 1.2,
  juror: 0.4,
  revise: 0.8,
};
