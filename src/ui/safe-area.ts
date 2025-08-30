export interface SafeArea {
  top: number;
  bottom: number;
}

export function getSafeArea(): SafeArea {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '0';
  div.style.height = '0';
  div.style.paddingTop = 'env(safe-area-inset-top)';
  div.style.paddingBottom = 'env(safe-area-inset-bottom)';
  document.body.appendChild(div);
  const cs = getComputedStyle(div);
  const top = parseInt(cs.paddingTop) || 0;
  const bottom = parseInt(cs.paddingBottom) || 0;
  document.body.removeChild(div);
  return { top, bottom };
}
