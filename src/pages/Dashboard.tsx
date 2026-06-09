import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Wallet, LogOut, CheckCircle2, Eye, Sparkles, Trash2, Mail, RefreshCw, Save, ScanSearch } from 'lucide-react'
import { MAX_USER_TEMPLATES, type Template } from '../types/template.types'
import {
  createTemplate,
  deleteTemplate as deleteTemplateRequest,
  getCurrentExpenseFile,
  getTemplateDashboard,
  overwriteCurrentExpenseFile,
  sendTestEmail as sendTestEmailRequest,
  setActiveTemplate as setActiveTemplateRequest,
  updateDataSource,
  uploadExpenseFile,
  type DataSourceType,
} from '../services/onboarding.service'
import {
  getPredefinedTemplate,
  getPredefinedTemplates,
  isPredefinedTemplateId,
  type PredefinedTemplate,
} from '../data/predefinedTemplates'
import {
  applyTemplatePreviewSamples,
  getExampleTemplateValues,
} from '../lib/templatePreview'

type SelectedTemplate =
  | { kind: 'predefined'; template: PredefinedTemplate }
  | { kind: 'user'; template: Template }

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'pl'
  const location = useLocation()
  const { user, session, signOut } = useAuthStore()
  const predefinedTemplates = useMemo(() => getPredefinedTemplates(locale), [locale])
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [isSavingPath, setIsSavingPath] = useState(false)
  const [isUploadingExpenseFile, setIsUploadingExpenseFile] = useState(false)
  const [isLoadingCurrentExpenseFile, setIsLoadingCurrentExpenseFile] = useState(false)
  const [isSavingCurrentExpenseFile, setIsSavingCurrentExpenseFile] = useState(false)
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('FILE_UPLOAD')
  const [nextcloudFilePath, setNextcloudFilePath] = useState('')
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [expenseFileContent, setExpenseFileContent] = useState('')
  const [savedExpenseFileContent, setSavedExpenseFileContent] = useState('')
  const [selectedExpenseFile, setSelectedExpenseFile] = useState<File | null>(null)
  const [testEmailRecipient, setTestEmailRecipient] = useState('')
  const [showExamplePreview, setShowExamplePreview] = useState(true)

  const selectedTemplate = useMemo((): SelectedTemplate | null => {
    if (!selectedTemplateId) {
      return null
    }
    const predefined = getPredefinedTemplate(selectedTemplateId, locale)
    if (predefined) {
      return { kind: 'predefined', template: predefined }
    }
    const userTemplate = templates.find((template) => template.id === selectedTemplateId)
    if (userTemplate) {
      return { kind: 'user', template: userTemplate }
    }
    return null
  }, [selectedTemplateId, templates, locale])

  const previewHtml = useMemo(() => {
    if (!selectedTemplate) {
      return ''
    }
    const content = selectedTemplate.template.content.trim()
    if (!content) {
      return ''
    }
    if (!showExamplePreview) {
      return selectedTemplate.template.content
    }
    return applyTemplatePreviewSamples(content, getExampleTemplateValues(user?.email, locale))
  }, [selectedTemplate, showExamplePreview, user?.email, locale])

  const isSelectedTemplateActive =
    selectedTemplate?.kind === 'user' && selectedTemplate.template.id === activeTemplateId
  const hasReachedTemplateLimit = templates.length >= MAX_USER_TEMPLATES
  const cannotAddSelectedTemplate =
    selectedTemplate?.kind === 'predefined' && hasReachedTemplateLimit
  const hasUnsavedExpenseFileChanges = expenseFileContent !== savedExpenseFileContent

  const selectPredefinedTemplate = useCallback((template: PredefinedTemplate) => {
    setSelectedTemplateId(template.id)
    setError(null)
    setSuccess(null)
  }, [])

  const selectUserTemplate = useCallback((template: Template) => {
    setSelectedTemplateId(template.id)
    setError(null)
    setSuccess(null)
  }, [])

  const resolveInitialSelection = useCallback(
    (
      userTemplates: Template[],
      preferredTemplateId?: string | null,
      currentActiveId?: string | null,
    ) => {
      if (preferredTemplateId) {
        if (isPredefinedTemplateId(preferredTemplateId) || userTemplates.some((t) => t.id === preferredTemplateId)) {
          setSelectedTemplateId(preferredTemplateId)
          return
        }
      }

      if (currentActiveId && userTemplates.some((template) => template.id === currentActiveId)) {
        setSelectedTemplateId(currentActiveId)
        return
      }

      if (userTemplates[0]) {
        setSelectedTemplateId(userTemplates[0].id)
        return
      }

      const firstPredefined = getPredefinedTemplates(locale)[0]
      if (firstPredefined) {
        setSelectedTemplateId(firstPredefined.id)
      }
    },
    [locale],
  )

  const loadDashboardData = useCallback(
    async (preferredTemplateId?: string | null, signal?: AbortSignal) => {
      if (!session?.access_token) {
        setIsCheckingOnboarding(false)
        return
      }

      setError(null)
      setIsLoadingDashboard(true)
      try {
        const dashboardData = await getTemplateDashboard(session.access_token, signal)
        setTemplates(dashboardData.templates)
        setActiveTemplateId(dashboardData.activeTemplateId)
        setDataSourceType(dashboardData.dataSourceType)
        setNextcloudFilePath(dashboardData.nextcloudFilePath ?? '')
        const currentUploadedFilePath = dashboardData.uploadedFilePath ?? null
        setUploadedFilePath(currentUploadedFilePath)
        if (!currentUploadedFilePath) {
          setExpenseFileContent('')
          setSavedExpenseFileContent('')
        }
        setTestEmailRecipient((current) => current || user?.email || '')
        resolveInitialSelection(
          dashboardData.templates,
          preferredTemplateId,
          dashboardData.activeTemplateId,
        )
      } catch (fetchError) {
        if (signal?.aborted) {
          return
        }
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : t('dashboard.fetchDashboardError')
        setError(message)
      } finally {
        if (signal?.aborted) {
          return
        }
        setIsLoadingDashboard(false)
        setIsCheckingOnboarding(false)
      }
    },
    [resolveInitialSelection, session?.access_token, t, user?.email],
  )

  const syncCurrentExpenseFile = useCallback(async (accessToken: string) => {
    setIsLoadingCurrentExpenseFile(true)
    try {
      const fileData = await getCurrentExpenseFile(accessToken)
      setExpenseFileContent(fileData.content)
      setSavedExpenseFileContent(fileData.content)
      setUploadedFilePath(fileData.uploadedFilePath)
    } finally {
      setIsLoadingCurrentExpenseFile(false)
    }
  }, [])

  const loadCurrentExpenseFile = useCallback(async () => {
    if (!session?.access_token || !uploadedFilePath) {
      setExpenseFileContent('')
      setSavedExpenseFileContent('')
      return
    }

    await syncCurrentExpenseFile(session.access_token)
  }, [session?.access_token, syncCurrentExpenseFile, uploadedFilePath])

  useEffect(() => {
    const controller = new AbortController()
    void loadDashboardData(undefined, controller.signal)
    return () => controller.abort()
  }, [loadDashboardData])

  useEffect(() => {
    if (!session?.access_token || !uploadedFilePath) {
      return
    }

    void loadCurrentExpenseFile().catch((fetchError) => {
      const message =
        fetchError instanceof Error ? fetchError.message : t('dashboard.fetchFileError')
      setError(message)
    })
  }, [loadCurrentExpenseFile, session?.access_token, t, uploadedFilePath])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('setup') === 'upload') {
      setDataSourceType('FILE_UPLOAD')
      setSuccess(t('dashboard.setupUploadSuccess'))
    }
  }, [location.search, t])

  const handleUseTemplate = async () => {
    if (!session?.access_token || !selectedTemplate) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsApplyingTemplate(true)

    try {
      if (selectedTemplate.kind === 'predefined') {
        const created = await createTemplate(
          session.access_token,
          selectedTemplate.template.name,
          selectedTemplate.template.content,
        )
        await setActiveTemplateRequest(session.access_token, created.id)
        await loadDashboardData(created.id)
        setSuccess(t('dashboard.templateAddedActive'))
        return
      }

      if (selectedTemplate.template.id === activeTemplateId) {
        setSuccess(t('dashboard.alreadyActive'))
        return
      }

      await setActiveTemplateRequest(session.access_token, selectedTemplate.template.id)
      await loadDashboardData(selectedTemplate.template.id)
      setSuccess(t('dashboard.activeTemplateSet'))
    } catch (applyError) {
      const message =
        applyError instanceof Error ? applyError.message : t('dashboard.applyTemplateError')
      setError(message)
    } finally {
      setIsApplyingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (template: Template) => {
    if (!session?.access_token) {
      return
    }

    const shouldDelete = window.confirm(t('dashboard.deleteConfirm', { name: template.name }))
    if (!shouldDelete) {
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await deleteTemplateRequest(session.access_token, template.id)
      await loadDashboardData()
      setSuccess(t('dashboard.templateDeleted'))
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : t('dashboard.deleteTemplateError')
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
      await updateDataSource(session.access_token, 'NEXTCLOUD', nextcloudFilePath)
      await loadDashboardData(selectedTemplateId)
      setSuccess(t('dashboard.nextcloudSaved'))
    } catch (savePathError) {
      const message =
        savePathError instanceof Error
          ? savePathError.message
          : t('dashboard.dataSourceSaveError')
      setError(message)
    } finally {
      setIsSavingPath(false)
    }
  }

  const handleSelectDataSource = async (type: DataSourceType) => {
    if (!session?.access_token) {
      return
    }

    setError(null)
    setSuccess(null)
    setDataSourceType(type)

    if (type === 'FILE_UPLOAD' && uploadedFilePath) {
      try {
        await updateDataSource(session.access_token, 'FILE_UPLOAD')
        await loadDashboardData(selectedTemplateId)
        setSuccess(t('dashboard.switchedToUpload'))
      } catch (switchError) {
        const message =
          switchError instanceof Error ? switchError.message : t('dashboard.dataSourceSwitchError')
        setError(message)
      }
    }
  }

  const handleUploadExpenseFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token || !selectedExpenseFile) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsUploadingExpenseFile(true)
    try {
      await uploadExpenseFile(session.access_token, selectedExpenseFile)
      setSelectedExpenseFile(null)
      await loadDashboardData(selectedTemplateId)
      await syncCurrentExpenseFile(session.access_token)
      setDataSourceType('FILE_UPLOAD')
      setSuccess(t('dashboard.fileUploaded'))
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : t('dashboard.uploadError')
      setError(message)
    } finally {
      setIsUploadingExpenseFile(false)
    }
  }

  const handleRefreshExpenseFile = async () => {
    setError(null)
    setSuccess(null)
    try {
      await loadCurrentExpenseFile()
      setSuccess(t('dashboard.fileRefreshed'))
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : t('dashboard.refreshError')
      setError(message)
    }
  }

  const handleSaveExpenseFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token || !uploadedFilePath) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsSavingCurrentExpenseFile(true)
    try {
      await overwriteCurrentExpenseFile(
        session.access_token,
        expenseFileContent,
        uploadedFilePath,
      )
      await loadDashboardData(selectedTemplateId)
      await syncCurrentExpenseFile(session.access_token)
      setSuccess(t('dashboard.expenseFileSaved'))
    } catch (saveFileError) {
      const message =
        saveFileError instanceof Error ? saveFileError.message : t('dashboard.saveFileError')
      setError(message)
    } finally {
      setIsSavingCurrentExpenseFile(false)
    }
  }

  const handleSendTestEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsSendingTestEmail(true)
    try {
      await sendTestEmailRequest(session.access_token, testEmailRecipient)
      setSuccess(t('dashboard.testEmailSent', { email: testEmailRecipient.trim() }))
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : t('dashboard.testEmailError')
      setError(message)
    } finally {
      setIsSendingTestEmail(false)
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
              <LanguageSwitcher />
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.dataSourceTitle')}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {t('dashboard.dataSourceDesc')}
                </p>
              </div>
              <Link
                to="/receipt-scan"
                className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <ScanSearch className="h-4 w-4" />
                {t('dashboard.scanReceipt')}
              </Link>
            </div>
            <div className="mt-4 inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => void handleSelectDataSource('FILE_UPLOAD')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  dataSourceType === 'FILE_UPLOAD'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('dashboard.uploadFile')}
              </button>
              <button
                type="button"
                onClick={() => void handleSelectDataSource('NEXTCLOUD')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  dataSourceType === 'NEXTCLOUD'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Nextcloud
              </button>
            </div>

            {dataSourceType === 'FILE_UPLOAD' ? (
              <div className="mt-4 space-y-3">
                <form onSubmit={handleUploadExpenseFile} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="file"
                    accept=".txt,.csv,text/plain,text/csv"
                    onChange={(event) => setSelectedExpenseFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isUploadingExpenseFile || !selectedExpenseFile}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploadingExpenseFile ? t('common.uploading') : t('common.upload')}
                  </button>
                </form>
                {uploadedFilePath ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-600">
                      {t('dashboard.currentFile')} <span className="font-medium">{uploadedFilePath}</span>
                    </p>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-gray-700">
                          {t('dashboard.filePreviewTitle')}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleRefreshExpenseFile()}
                          disabled={isLoadingCurrentExpenseFile || isSavingCurrentExpenseFile}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {t('common.refresh')}
                        </button>
                      </div>
                      {isLoadingCurrentExpenseFile ? (
                        <p className="text-xs text-gray-500">{t('dashboard.loadingFile')}</p>
                      ) : (
                        <form onSubmit={handleSaveExpenseFile} className="space-y-2">
                          <textarea
                            value={expenseFileContent}
                            onChange={(event) => setExpenseFileContent(event.target.value)}
                            rows={10}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p
                              className={`text-xs ${
                                hasUnsavedExpenseFileChanges ? 'text-amber-700' : 'text-gray-500'
                              }`}
                            >
                              {hasUnsavedExpenseFileChanges
                                ? t('dashboard.unsavedFileChanges')
                                : t('dashboard.fileSaved')}
                            </p>
                            <button
                              type="submit"
                              disabled={
                                isSavingCurrentExpenseFile ||
                                isLoadingCurrentExpenseFile ||
                                !hasUnsavedExpenseFileChanges
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Save className="h-3.5 w-3.5" />
                              {isSavingCurrentExpenseFile ? t('common.saving') : t('dashboard.saveChanges')}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">
                    {t('dashboard.noUploadedFile')}
                  </p>
                )}
              </div>
            ) : (
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
                  {isSavingPath ? t('common.saving') : t('common.save')}
                </button>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.testEmailTitle')}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {t('dashboard.testEmailDesc')}
            </p>
            <form onSubmit={handleSendTestEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(event) => setTestEmailRecipient(event.target.value)}
                placeholder={t('dashboard.emailPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={isSendingTestEmail || !activeTemplateId || !testEmailRecipient.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {isSendingTestEmail ? t('common.sending') : t('common.send')}
              </button>
            </form>
            {!activeTemplateId && (
              <p className="mt-2 text-xs text-amber-700">
                {t('dashboard.noActiveTemplate')}
              </p>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.templatesTitle')}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {t('dashboard.templatesDesc')}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t('dashboard.userTemplatesCount', { count: templates.length, max: MAX_USER_TEMPLATES })}
                </p>
                {hasReachedTemplateLimit && (
                  <p className="mt-2 text-xs text-amber-700">
                    {t('dashboard.templateLimitReached', { max: MAX_USER_TEMPLATES })}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <h3 className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('dashboard.predefined')}
                </h3>
                <div className="space-y-2">
                  {predefinedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`rounded-md border p-3 ${
                        selectedTemplateId === template.id
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-purple-100 bg-purple-50/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectPredefinedTemplate(template)}
                        className="w-full text-left"
                      >
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">{template.description}</p>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('dashboard.myTemplates')}
                </h3>
                {isLoadingDashboard ? (
                  <p className="text-sm text-gray-500">{t('dashboard.loadingTemplates')}</p>
                ) : templates.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {t('dashboard.noUserTemplates')}{' '}
                    <Link to="/onboarding" className="text-blue-600 underline hover:text-blue-800">
                      {t('dashboard.generateNew')}
                    </Link>
                    .
                  </p>
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
                          onClick={() => selectUserTemplate(template)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-gray-900">{template.name}</p>
                          {activeTemplateId === template.id && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t('common.active')}
                            </p>
                          )}
                        </button>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(template)}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('common.delete')}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                {hasReachedTemplateLimit ? (
                  <p className="text-center text-xs text-amber-700">
                    {t('dashboard.deleteTemplateToGenerate')}
                  </p>
                ) : (
                  <Link
                    to="/onboarding"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('dashboard.generateNewTemplate')}
                  </Link>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.previewTitle')}</h2>
              </div>

              {!selectedTemplate ? (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                  {t('dashboard.selectTemplateHint')}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {selectedTemplate.template.name}
                    </h3>
                    {selectedTemplate.kind === 'predefined' && (
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedTemplate.template.description}
                      </p>
                    )}
                    {isSelectedTemplateActive && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t('dashboard.activeTemplateNote')}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-700">{t('dashboard.emailPreviewLabel')}</p>
                      <label className="inline-flex cursor-pointer items-center gap-2.5">
                        <span className="text-sm text-gray-600">{t('dashboard.exampleData')}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={showExamplePreview}
                          aria-label={t('dashboard.exampleDataAria')}
                          onClick={() => setShowExamplePreview((current) => !current)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            showExamplePreview ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              showExamplePreview ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                    {showExamplePreview && (
                      <p className="mb-2 text-xs text-gray-500">
                        {t('dashboard.exampleDataHint')}
                      </p>
                    )}
                    <div className="overflow-hidden rounded-md border border-gray-300">
                      <iframe
                        title="Template HTML preview"
                        srcDoc={previewHtml}
                        className="h-[min(920px,75vh)] w-full bg-white"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => void handleUseTemplate()}
                      disabled={isApplyingTemplate || isSelectedTemplateActive || cannotAddSelectedTemplate}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApplyingTemplate
                        ? t('dashboard.applying')
                        : isSelectedTemplateActive
                          ? t('dashboard.templateActive')
                          : t('dashboard.useTemplate')}
                    </button>
                    {cannotAddSelectedTemplate && (
                      <p className="text-xs text-amber-700">
                        {t('dashboard.predefinedLimitHint', { max: MAX_USER_TEMPLATES })}
                      </p>
                    )}
                    {!hasReachedTemplateLimit && (
                      <Link
                        to="/onboarding"
                        className="text-sm text-blue-600 underline hover:text-blue-800"
                      >
                        {t('dashboard.generateOtherAi')}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
