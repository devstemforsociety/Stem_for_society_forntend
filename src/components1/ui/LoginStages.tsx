import { useEffect, useState } from "react";

export type AnimationStage = "initial" | "textFadeOut" | "logoTransition";

interface LoginStagesProps {
  children: (stage: AnimationStage) => React.ReactNode;
}

/**
 * Intro timings for the sign-in and password-reset screens.
 *
 * These were 2000ms and 2500ms. The form panel only becomes visible at the
 * final stage and then animates in over its own 2.5s transition, so a visitor
 * who opened the page - or clicked through to it - sat in front of an
 * unusable form for roughly five seconds. The intro is decoration; it should
 * not gate the primary action of the page.
 */
const TEXT_FADE_OUT_MS = 400;
const LOGO_TRANSITION_MS = 700;

/** Visitors who ask for less motion get the finished layout immediately. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const LoginStages = ({ children }: LoginStagesProps) => {
  const [stage, setStage] = useState<AnimationStage>(() =>
    prefersReducedMotion() ? "logoTransition" : "initial",
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const timer1 = setTimeout(() => setStage("textFadeOut"), TEXT_FADE_OUT_MS);
    const timer2 = setTimeout(
      () => setStage("logoTransition"),
      LOGO_TRANSITION_MS,
    );

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return <>{children(stage)}</>;
};

export default LoginStages;
