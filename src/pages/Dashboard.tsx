import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Wallet, LogOut, CheckCircle2, PencilLine, Plus, Trash2 } from 'lucide-react'
import type { Template } from '../types/template.types'
import {
  createTemplate,
  deleteTemplate as deleteTemplateRequest,
  getTemplateDashboard,
  setActiveTemplate as setActiveTemplateRequest,
  updateNextcloudFilePath,
  updateTemplate,
} from '../services/onboarding.service'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, session, signOut } = useAuthStore()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isSavingPath, setIsSavingPath] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [nextcloudFilePath, setNextcloudFilePath] = useState('')

  const pickTemplate = useCallback(
    (allTemplates: Template[], preferredTemplateId?: string | null) => {
      const preferredTemplate =
        (preferredTemplateId && allTemplates.find((template) => template.id === preferredTemplateId)) ||
        (activeTemplateId && allTemplates.find((template) => template.id === activeTemplateId)) ||
        allTemplates[0] ||
        null

      setSelectedTemplateId(preferredTemplate?.id ?? null)
      setTemplateName(preferredTemplate?.name ?? '')
      setTemplateContent(preferredTemplate?.content ?? '')
    },
    [activeTemplateId],
  )

  const loadDashboardData = useCallback(
    async (preferredTemplateId?: string | null) => {
      if (!session?.access_token) {
        setIsCheckingOnboarding(false)
        return
      }

      setError(null)
      setIsLoadingDashboard(true)
      try {
        const dashboardData = await getTemplateDashboard(session.access_token)
        if (dashboardData.templates.length === 0) {
          navigate('/onboarding', { replace: true })
          return
        }

        setTemplates(dashboardData.templates)
        setActiveTemplateId(dashboardData.activeTemplateId)
        setNextcloudFilePath(dashboardData.nextcloudFilePath ?? '')
        pickTemplate(dashboardData.templates, preferredTemplateId)
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Nie udało się pobrać danych dashboardu'
        setError(message)
      } finally {
        setIsLoadingDashboard(false)
        setIsCheckingOnboarding(false)
      }
    },
    [navigate, pickTemplate, session?.access_token],
  )

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  const selectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateContent(template.content)
    setError(null)
    setSuccess(null)
  }

  const handleStartCreatingTemplate = () => {
    setSelectedTemplateId(null)
    setTemplateName('Nowy szablon')
    setTemplateContent('')
    setError(null)
    setSuccess(null)
  }

  const handleSaveTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsSavingTemplate(true)
    try {
      if (selectedTemplateId) {
        await updateTemplate(
          session.access_token,
          selectedTemplateId,
          templateName,
          templateContent,
        )
        await loadDashboardData(selectedTemplateId)
        setSuccess('Szablon został zaktualizowany.')
      } else {
        const created = await createTemplate(
          session.access_token,
          templateName,
          templateContent,
        )
        await loadDashboardData(created.id)
        setSuccess('Nowy szablon został zapisany.')
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Nie udało się zapisać szablonu'
      setError(message)
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const handleSetActiveTemplate = async (templateId: string) => {
    if (!session?.access_token) {
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await setActiveTemplateRequest(session.access_token, templateId)
      await loadDashboardData(templateId)
      setSuccess('Ustawiono aktywny szablon.')
    } catch (setActiveError) {
      const message =
        setActiveError instanceof Error
          ? setActiveError.message
          : 'Nie udało się ustawić aktywnego szablonu'
      setError(message)
    }
  }

  const handleDeleteTemplate = async (template: Template) => {
    if (!session?.access_token) {
      return
    }

    const shouldDelete = window.confirm(`Usunąć szablon "${template.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await deleteTemplateRequest(session.access_token, template.id)
      await loadDashboardData()
      setSuccess('Szablon został usunięty.')
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Nie udało się usunąć szablonu'
      setError(message)
    }
  }

  const handleSaveNextcloudPath = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsSavingPath(true)
    try {
      await updateNextcloudFilePath(session.access_token, nextcloudFilePath)
      await loadDashboardData(selectedTemplateId)
      setSuccess('Ścieżka Nextcloud została zapisana.')
    } catch (savePathError) {
      const message =
        savePathError instanceof Error
          ? savePathError.message
          : 'Nie udało się zapisać ścieżki Nextcloud'
      setError(message)
    } finally {
      setIsSavingPath(false)
    }
  }

  if (isCheckingOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Wallet className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">ExpenseAI</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Plik z wydatkami (Nextcloud)</h2>
            <p className="mt-1 text-sm text-gray-600">
              Podaj ścieżkę do pliku tekstowego, który będzie przetwarzany podczas procesu miesięcznego.
            </p>
            <form onSubmit={handleSaveNextcloudPath} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={nextcloudFilePath}
                onChange={(event) => setNextcloudFilePath(event.target.value)}
                placeholder="/shared/wydatki/2026-06.txt"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={isSavingPath}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPath ? 'Zapisywanie...' : 'Zapisz ścieżkę'}
              </button>
            </form>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Twoje szablony</h2>
                <button
                  type="button"
                  onClick={handleStartCreatingTemplate}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nowy
                </button>
              </div>

              {isLoadingDashboard ? (
                <p className="text-sm text-gray-500">Ładowanie szablonów...</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`rounded-md border p-3 ${
                        selectedTemplateId === template.id
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectTemplate(template)}
                        className="w-full text-left"
                      >
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        {activeTemplateId === template.id && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aktywny
                          </p>
                        )}
                      </button>
                      <div className="mt-3 flex items-center gap-2">
                        {activeTemplateId !== template.id && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveTemplate(template.id)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Ustaw aktywny
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Trash2 className="h-3.5 w-3.5" />
                            Usuń
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <PencilLine className="h-4 w-4 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedTemplateId ? 'Edycja szablonu' : 'Nowy szablon'}
                </h2>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label htmlFor="template-name" className="mb-1 block text-sm font-medium text-gray-700">
                    Nazwa
                  </label>
                  <input
                    id="template-name"
                    value={templateName}
                    onChange={(event) => setTemplateName(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Np. Podsumowanie motywacyjne"
                  />
                </div>

                <div>
                  <label htmlFor="template-content" className="mb-1 block text-sm font-medium text-gray-700">
                    Treść HTML
                  </label>
                  <textarea
                    id="template-content"
                    value={templateContent}
                    onChange={(event) => setTemplateContent(event.target.value)}
                    rows={14}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="<html><body>...</body></html>"
                  />
                </div>

                <div>
                  <p className="mb-2 block text-sm font-medium text-gray-700">Podgląd renderowanego HTML</p>
                  <div className="overflow-hidden rounded-md border border-gray-300">
                    {templateContent.trim() ? (
                      <iframe
                        title="Template HTML preview"
                        srcDoc={templateContent}
                        className="h-[420px] w-full bg-white"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-gray-50 text-sm text-gray-500">
                        Brak treści HTML do podglądu.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingTemplate}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingTemplate ? 'Zapisywanie...' : 'Zapisz szablon'}
                  </button>
                  <Link to="/onboarding" className="text-sm text-blue-600 underline hover:text-blue-800">
                    Wygeneruj nowy przez onboarding
                  </Link>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
