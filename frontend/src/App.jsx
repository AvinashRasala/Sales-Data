import { useState, useCallback } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'
import TopHeader from './components/TopHeader'
import DatasetsPage from './components/DatasetsPage'
import { useAuth } from './contexts/AuthContext'
import { getDataset } from './api'

export default function App() {
  const [view, setView] = useState('upload') // 'upload' | 'datasets' | 'dashboard'
  const [dataset, setDataset] = useState(null)
  const [search, setSearch] = useState('')
  const { user, loading, isSupabaseConfigured, signOut } = useAuth()

  const handleUploaded = useCallback((result) => {
    setDataset(result)
    setView('dashboard')
  }, [])

  const handleSelectDataset = useCallback(async (id) => {
    try {
      const full = await getDataset(id)
      setDataset(full)
      setView('dashboard')
    } catch {
      alert('Could not load that dataset.')
    }
  }, [])

  const handleNavigate = useCallback((key) => {
    if (key === 'dashboard' && !dataset) {
      setView('datasets')
    } else {
      setView(key)
    }
  }, [dataset])

  if (isSupabaseConfigured && loading) {
    return <div style={{ minHeight: '100vh' }} />
  }

  if (isSupabaseConfigured && !user) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <AuthScreen />
      </div>
    )
  }

  const breadcrumbFor = {
    upload: 'Home / Upload',
    datasets: 'Home / Datasets',
    dashboard: `Home / Dashboard${dataset ? ` / ${dataset.filename}` : ''}`,
  }
  const titleFor = {
    upload: 'Upload',
    datasets: 'Datasets',
    dashboard: 'Dashboard',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={view === 'dashboard' && !dataset ? 'datasets' : view} onNavigate={handleNavigate} user={user} onSignOut={signOut} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopHeader
          title={titleFor[view]}
          breadcrumb={breadcrumbFor[view]}
          anomalyCount={view === 'dashboard' ? dataset?.cleaning_report?.anomalies_detected : undefined}
          searchValue={view === 'datasets' ? search : undefined}
          onSearchChange={view === 'datasets' ? setSearch : undefined}
        />

        <div style={{ flex: 1, overflow: 'auto' }}>
          {view === 'upload' && <UploadScreen onUploaded={handleUploaded} />}
          {view === 'datasets' && <DatasetsPage onSelect={handleSelectDataset} searchValue={search} />}
          {view === 'dashboard' && dataset && (
            <Dashboard dataset={dataset} onReset={() => setView('upload')} />
          )}
          {view === 'dashboard' && !dataset && <DatasetsPage onSelect={handleSelectDataset} searchValue={search} />}
        </div>
      </div>
    </div>
  )
}
