/** Habere bırakılabilen emoji tepkileri. */
export const REACTION_TYPES = ["mutlu", "alkis", "uzgun", "sasirmis", "kizgin"] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  mutlu: { emoji: "😊", label: "Mutlu" },
  alkis: { emoji: "👏", label: "Alkış" },
  uzgun: { emoji: "😢", label: "Üzgün" },
  sasirmis: { emoji: "😮", label: "Şaşırmış" },
  kizgin: { emoji: "😡", label: "Kızgın" },
};
