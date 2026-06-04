import { create } from 'zustand'
import type { OnboardingPreferences } from '../types/onboarding.types'
import type { Template } from '../types/template.types'
import { generateTemplate } from '../services/onboarding.service'
import { useAuthStore } from './useAuthStore'

interface OnboardingState {
  preferences: OnboardingPreferences
  generatedTemplate: Template | null
  isLoading: boolean
  error: string | null
  setPreference: <K extends keyof OnboardingPreferences>(key: K, value: OnboardingPreferences[K]) => void
  submitPreferences: () => Promise<void>
}

const defaultPreferences: OnboardingPreferences = {
  tone: 'formalny',
  detailLevel: 'podsumowanie',
  focus: 'zrównoważony',
  visualStyle: 'minimalistyczny',
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  preferences: defaultPreferences,
  generatedTemplate: null,
  isLoading: false,
  error: null,

  setPreference: (key, value) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: value,
      },
    }))
  },

  submitPreferences: async () => {
    const { preferences } = get()
    const session = useAuthStore.getState().session
  
    if (!session?.access_token) {
      set({ error: 'Brak autoryzacji' })
      return
    }

    set({ isLoading: true, error: null })
    
    try {
      const template = await generateTemplate(preferences, session.access_token)
      set({ generatedTemplate: template })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message })
      } else {
        set({ error: 'Wystąpił błąd podczas zapisywania preferencji' })
      }
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
}))
