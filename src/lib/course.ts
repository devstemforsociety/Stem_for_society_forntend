/**
 * Presentation helpers shared by the public, partner and admin course views.
 *
 * These surfaces read the same training record but used to format it
 * independently, so the same course could read "Online Session" publicly and
 * "Chennai" in the partner portal. Formatting in one place keeps them honest.
 */

/** Delivery mode as stored on the training record. */
export type CourseDeliveryType = "ONLINE" | "OFFLINE" | "HYBRID" | null | undefined;

/**
 * Where the course happens.
 *
 * Never invents a venue: the public page previously fell back to a hard-coded
 * "Rangoli Metro Art Centre, Bangalore" whenever an offline course had no
 * location set, which could send someone to an address that has nothing to do
 * with the course.
 */
export function formatCourseLocation(
  type: CourseDeliveryType,
  location?: string | null,
): string {
  if (type === "ONLINE") return "Online session";

  const place = location?.trim();
  if (place) return type === "HYBRID" ? `${place} + online` : place;

  return "Location to be announced";
}

/** True when the course needs a joining link to be attendable. */
export function requiresMeetingLink(type: CourseDeliveryType): boolean {
  return type === "ONLINE" || type === "HYBRID";
}
