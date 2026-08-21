/**
 * Cover images are optional in the API: a training can be created without one,
 * and stored URLs can rot. Both cases used to render an empty <img>, which the
 * browser shows as a blank or broken box.
 */
export const COURSE_IMAGE_FALLBACK = "/logo-01.png";

/** Swaps in the placeholder when the real image fails to load. */
export function handleCourseImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
): void {
  const img = event.currentTarget;
  // Guard against a loop if the placeholder itself is ever missing.
  if (!img.src.endsWith(COURSE_IMAGE_FALLBACK)) {
    img.src = COURSE_IMAGE_FALLBACK;
  }
}
