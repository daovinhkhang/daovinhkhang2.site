/**
 * Open external HTTP(S) URLs in a centered floating browser popup window
 * instead of jumping to another browser tab. Mail and phone links keep `_self`.
 */
export function openLinkWindow(href) {
  if (!href) return null;
  if (/^(mailto|tel):/i.test(href)) {
    return window.open(href, '_self');
  }

  const availW = window.screen?.availWidth || window.innerWidth || 1280;
  const availH = window.screen?.availHeight || window.innerHeight || 800;
  const w = Math.min(1040, Math.max(460, Math.round(availW * 0.72)));
  const h = Math.min(780, Math.max(520, Math.round(availH * 0.8)));

  const baseX = typeof window.screenX === 'number' ? window.screenX : 0;
  const baseY = typeof window.screenY === 'number' ? window.screenY : 0;
  const outerW = window.outerWidth || window.innerWidth || w;
  const outerH = window.outerHeight || window.innerHeight || h;
  const left = Math.max(0, Math.round(baseX + (outerW - w) / 2));
  const top = Math.max(0, Math.round(baseY + (outerH - h) / 2));

  const features = `popup=yes,width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,location=yes,menubar=no,toolbar=no,status=no`;
  const win = window.open(href, 'khang_link_window', features);
  if (win) {
    try {
      win.opener = null;
    } catch {
      /* ignore cross-origin restriction */
    }
    win.focus?.();
  }
  return win;
}
