import { MessageCircle, Stethoscope, Users, Facebook, Instagram, Globe, Search, Megaphone, Tent, Footprints, FileUp } from "lucide-react";

// Icon + colour for each lead source, shown in the follow-up table.
const SOURCE_META = {
  "WhatsApp": { icon: MessageCircle, color: "#25A15B" },
  "OPD Appointment": { icon: Stethoscope, color: "#7C5BC7" },
  "Referral": { icon: Users, color: "#6554C0" },
  "Facebook": { icon: Facebook, color: "#1877F2" },
  "Meta Ads": { icon: Megaphone, color: "#1877F2" },
  "Instagram": { icon: Instagram, color: "#D6336C" },
  "Website": { icon: Globe, color: "#17A393" },
  "Google Ads": { icon: Search, color: "#E8710A" },
  "Camp": { icon: Tent, color: "#A15C08" },
  "Walk-in": { icon: Footprints, color: "#5B6E76" },
  "Import": { icon: FileUp, color: "#5B6E76" },
};

export function sourceMeta(source) {
  return SOURCE_META[source] || { icon: Globe, color: "#5B6E76" };
}
