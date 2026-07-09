"use client";

import { useState } from "react";
import OnboardingTour from "./OnboardingTour";

export default function OnboardingWrapper() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return <OnboardingTour onComplete={() => setVisible(false)} />;
}
