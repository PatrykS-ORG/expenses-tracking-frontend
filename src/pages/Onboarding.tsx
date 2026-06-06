import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useOnboardingStore } from '../store/useOnboardingStore'
import { useAuthStore } from '../store/useAuthStore'
import { getMyTemplates } from '../services/onboarding.service'
import { MAX_USER_TEMPLATES } from '../types/template.types'
import { ArrowLeft, Sparkles } from 'lucide-react'
import type { TonePreference, DetailLevelPreference, FocusPreference, VisualStylePreference } from '../types/onboarding.types'

export function Onboarding() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const { preferences, isLoading, error, setPreference, submitPreferences } = useOnboardingStore()
  const [templateCount, setTemplateCount] = useState<number | null>(null)
  const hasReachedTemplateLimit =
    templateCount !== null && templateCount >= MAX_USER_TEMPLATES

  useEffect(() => {
    if (!session?.access_token) {
      return
    }

    const controller = new AbortController()
    void getMyTemplates(session.access_token)
      .then((templates) => {
        if (!controller.signal.aborted) {
          setTemplateCount(templates.length)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTemplateCount(null)
        }
      })

    return () => controller.abort()
  }, [session?.access_token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await submitPreferences()
      // Po wygenerowaniu szablonu przechodzimy do kroku przesłania pliku.
      navigate('/?setup=upload')
    } catch {
      // Błąd jest już obsługiwany w store i wyświetlany w UI
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do panelu
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Skonfiguruj swoje podsumowania</h1>
          <p className="mt-4 text-lg text-gray-600">
            Odpowiedz na kilka pytań, a nasza sztuczna inteligencja przygotuje dla Ciebie spersonalizowany szablon e-maila.
            W kolejnym kroku prześlesz plik wydatków.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          {/* Ton wiadomości */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              Jaki powinien być ton wiadomości?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['formalny', 'humorystyczny', 'motywacyjny'] as const).map((tone) => (
                <label
                  key={tone}
                  className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                    preferences.tone === tone
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={tone}
                    checked={preferences.tone === tone}
                    onChange={(e) => setPreference('tone', e.target.value as TonePreference)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900 capitalize">
                        {tone}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Poziom szczegółowości */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              Jak bardzo szczegółowe ma być podsumowanie?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['podsumowanie', 'wyliczenie'] as const).map((level) => (
                <label
                  key={level}
                  className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                    preferences.detailLevel === level
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="detailLevel"
                    value={level}
                    checked={preferences.detailLevel === level}
                    onChange={(e) => setPreference('detailLevel', e.target.value as DetailLevelPreference)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900 capitalize">
                        {level === 'podsumowanie' ? 'Tylko ogólne podsumowanie' : 'Wyliczenie każdej pozycji'}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Główny nacisk */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              Na co chcesz kłaść największy nacisk?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['oszczędności', 'przekroczenia', 'zrównoważony'] as const).map((focus) => (
                <label
                  key={focus}
                  className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                    preferences.focus === focus
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="focus"
                    value={focus}
                    checked={preferences.focus === focus}
                    onChange={(e) => setPreference('focus', e.target.value as FocusPreference)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900 capitalize">
                        {focus}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Styl wizualny */}
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              Wybierz styl wizualny wiadomości e-mail
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['minimalistyczny', 'kolorowy', 'korporacyjny'] as const).map((style) => (
                <label
                  key={style}
                  className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                    preferences.visualStyle === style
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="visualStyle"
                    value={style}
                    checked={preferences.visualStyle === style}
                    onChange={(e) => setPreference('visualStyle', e.target.value as VisualStylePreference)}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900 capitalize">
                        {style}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {hasReachedTemplateLimit && (
            <div className="rounded-md bg-amber-50 p-4">
              <div className="text-sm text-amber-800">
                Masz już maksymalnie {MAX_USER_TEMPLATES} szablonów. Usuń istniejący szablon w panelu,
                aby wygenerować nowy.
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading || hasReachedTemplateLimit}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generowanie szablonu...' : 'Dalej: wygeneruj szablon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
