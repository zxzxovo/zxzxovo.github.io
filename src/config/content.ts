export const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export function isIsoDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_DATE_TIME_PATTERN.test(value) &&
    !Number.isNaN(new Date(value).valueOf())
  );
}
