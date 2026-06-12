import React from "react";
import { Crown, Gem, GraduationCap, Landmark, Star, Wrench } from "lucide-react-native";
import type { AvatarId } from "../data/catalog";

export function AvatarIcon({ avatar, color, size }: { avatar: AvatarId; color: string; size: number }) {
  if (avatar === "crown") return <Crown color={color} size={size} />;
  if (avatar === "gear") return <Wrench color={color} size={size} />;
  if (avatar === "cap") return <GraduationCap color={color} size={size} />;
  if (avatar === "gem") return <Gem color={color} size={size} />;
  if (avatar === "hall") return <Landmark color={color} size={size} />;
  return <Star color={color} size={size} />;
}
