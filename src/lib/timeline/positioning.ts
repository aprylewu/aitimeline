export function getPositionPercent(
  value: Date,
  range: { start: Date; end: Date },
) {
  const total = range.end.getTime() - range.start.getTime();
  const offset = value.getTime() - range.start.getTime();

  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (offset / total) * 100));
}
