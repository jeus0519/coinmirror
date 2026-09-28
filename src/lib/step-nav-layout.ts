export type StepNavScrollInput = {
  viewportWidth: number;
  contentWidth: number;
  currentScrollX: number;
  itemX: number;
  itemWidth: number;
  edgePadding?: number;
};

export function calculateStepNavScrollOffset({
  viewportWidth,
  contentWidth,
  currentScrollX,
  itemX,
  itemWidth,
  edgePadding = 16,
}: StepNavScrollInput): number {
  const maxScrollX = Math.max(0, contentWidth - viewportWidth);
  const clampedCurrentX = Math.min(Math.max(0, currentScrollX), maxScrollX);
  const visibleLeft = clampedCurrentX + edgePadding;
  const visibleRight = clampedCurrentX + viewportWidth - edgePadding;
  const itemRight = itemX + itemWidth;

  if (itemX >= visibleLeft && itemRight <= visibleRight) return clampedCurrentX;

  const centeredX = itemX + itemWidth / 2 - viewportWidth / 2;
  return Math.min(Math.max(0, centeredX), maxScrollX);
}
