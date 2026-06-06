import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, LogOut, Save, ScanSearch, Wallet } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { approveReceiptExpenses, scanReceipt } from '../services/onboarding.service'

export function ReceiptScanner() {
  const navigate = useNavigate()
  const { user, session, signOut } = useAuthStore()
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [lastScannedText, setLastScannedText] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedReceiptFile) {
      setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(selectedReceiptFile)
    setPreviewUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [selectedReceiptFile])

  const hasUnsavedReceiptChanges = useMemo(
    () => extractedText.trim().length > 0 && extractedText !== lastScannedText,
    [extractedText, lastScannedText],
  )

  const handleScanReceipt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token || !selectedReceiptFile) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsScanning(true)
    try {
      const { extractedText: nextExtractedText } = await scanReceipt(
        session.access_token,
        selectedReceiptFile,
      )
      setExtractedText(nextExtractedText)
      setLastScannedText(nextExtractedText)
      if (nextExtractedText === 'NO_EXPENSES_FOUND') {
        setSuccess('Nie znaleziono czytelnych wydatków. Możesz wpisać je ręcznie i zapisać.')
      } else {
        setSuccess('Wydatki zostały odczytane. Sprawdź treść i zatwierdź.')
      }
    } catch (scanError) {
      const message =
        scanError instanceof Error ? scanError.message : 'Nie udało się odczytać paragonu'
      setError(message)
    } finally {
      setIsScanning(false)
    }
  }

  const handleApproveReceipt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.access_token) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsApproving(true)
    try {
      await approveReceiptExpenses(session.access_token, extractedText)
      navigate('/')
    } catch (approveError) {
      const message =
        approveError instanceof Error ? approveError.message : 'Nie udało się zapisać wydatków'
      setError(message)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Wallet className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">ExpenseAI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <LogOut className="h-4 w-4" />
              Wyloguj
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Skanowanie paragonu</h1>
            <p className="mt-1 text-sm text-gray-600">
              Prześlij zdjęcie paragonu, sprawdź podgląd wydatków i zatwierdź zapis. Dla
              lepszego odczytu przykadruj sam paragon (bez stołu w tle) i upewnij się, że tekst
              jest ostry i dobrze oświetlony.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do dashboardu
          </Link>
        </div>

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
          <h2 className="text-lg font-semibold text-gray-900">1. Prześlij zdjęcie paragonu</h2>
          <p className="mt-1 text-sm text-gray-600">
            Obsługiwane formaty: JPG, PNG, WEBP (do 2MB). Przed wysłaniem przytnij zdjęcie tak,
            aby w kadrze był tylko paragon — mniej tła oznacza lepsze rozpoznawanie tekstu.
          </p>
          <form onSubmit={handleScanReceipt} className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setSelectedReceiptFile(file)
                  setExtractedText('')
                  setLastScannedText('')
                  setError(null)
                  setSuccess(null)
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={isScanning || !selectedReceiptFile}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ScanSearch className="h-4 w-4" />
                {isScanning ? 'Analizowanie...' : 'Skanuj paragon'}
              </button>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
              {previewUrl ? (
                <img src={previewUrl} alt="Podgląd paragonu" className="max-h-[420px] w-full object-contain" />
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Wybierz plik, aby zobaczyć podgląd zdjęcia.
                  </span>
                </div>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">2. Podgląd i edycja wydatków</h2>
          <p className="mt-1 text-sm text-gray-600">
            Możesz poprawić treść przed zatwierdzeniem. Po zapisaniu wydatki zostaną dopisane do
            aktualnego pliku.
          </p>

          <form onSubmit={handleApproveReceipt} className="mt-4 space-y-3">
            <textarea
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              rows={12}
              placeholder="Po zeskanowaniu zobaczysz tutaj odczytane wydatki..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-xs ${hasUnsavedReceiptChanges ? 'text-amber-700' : 'text-gray-500'}`}>
                {hasUnsavedReceiptChanges
                  ? 'Masz niezatwierdzone zmiany po skanowaniu.'
                  : 'Treść gotowa do zatwierdzenia.'}
              </p>
              <button
                type="submit"
                disabled={isApproving || !extractedText.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isApproving ? 'Zapisywanie...' : 'Zatwierdź i zapisz'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
