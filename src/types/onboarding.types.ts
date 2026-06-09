export type TonePreference = 'formalny' | 'humorystyczny' | 'motywacyjny';
export type DetailLevelPreference = 'podsumowanie' | 'wyliczenie';
export type FocusPreference = 'oszczędności' | 'przekroczenia' | 'zrównoważony';
export type VisualStylePreference =
  | 'minimalistyczny'
  | 'kolorowy'
  | 'korporacyjny';

export interface OnboardingPreferences {
  tone: TonePreference;
  detailLevel: DetailLevelPreference;
  focus: FocusPreference;
  visualStyle: VisualStylePreference;
}
