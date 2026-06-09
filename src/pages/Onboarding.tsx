import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnboardingStore } from '../store/useOnboardingStore'
import { useAuthStore } from '../store/useAuthStore'
import { getMyTemplates } from '../services/onboarding.service'
import { MAX_USER_TEMPLATES } from '../types/template.types'
import { ArrowLeft, Sparkles } from 'lucide-react'
import type { TonePreference, DetailLevelPreference, FocusPreference, VisualStylePreference } from '../types/onboarding.types'

export function Onboarding() {
  const { t } = useTranslation()
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
      navigate('/?setup=upload')
    } catch {
      // Error handled in store
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
          {t('onboarding.backToPanel')}
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('onboarding.title')}</h1>
          <p className="mt-4 text-lg text-gray-600">{t('onboarding.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              {t('onboarding.toneQuestion')}
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
                      <span className="block text-sm font-medium text-gray-900">
                        {t(`onboarding.tone.${tone}`)}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              {t('onboarding.detailQuestion')}
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
                      <span className="block text-sm font-medium text-gray-900">
                        {t(`onboarding.detail.${level}`)}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              {t('onboarding.focusQuestion')}
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
                      <span className="block text-sm font-medium text-gray-900">
                        {t(`onboarding.focus.${focus}`)}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              {t('onboarding.styleQuestion')}
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
                      <span className="block text-sm font-medium text-gray-900">
                        {t(`onboarding.style.${style}`)}
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
                {t('onboarding.templateLimit', { count: MAX_USER_TEMPLATES })}
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
              {isLoading ? t('onboarding.generating') : t('onboarding.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
