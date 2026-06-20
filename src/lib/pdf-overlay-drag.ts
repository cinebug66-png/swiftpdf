export function lockPdfOverlayTouchDrag(pointerType: string) {
  if (pointerType !== "touch" && pointerType !== "pen") {
    return () => {};
  }

  const preventTouchMove = (event: TouchEvent) => {
    event.preventDefault();
  };

  document.documentElement.classList.add("pdf-overlay-dragging");
  document.body.classList.add("pdf-overlay-dragging");
  document.addEventListener("touchmove", preventTouchMove, { passive: false });

  let unlocked = false;
  return () => {
    if (unlocked) return;
    unlocked = true;
    document.removeEventListener("touchmove", preventTouchMove);
    document.documentElement.classList.remove("pdf-overlay-dragging");
    document.body.classList.remove("pdf-overlay-dragging");
  };
}
