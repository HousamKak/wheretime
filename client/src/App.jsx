import { useEffect } from 'react'
import { useApp } from './contexts/AppContext'
import Header from './components/Header'
import Footer from './components/Footer'
import AppRoutes from './routes/AppRoutes'
import { Loader } from './components/common/Loader'

function App() {
  const { loading, initializing, initialize } = useApp()

  // Initialize app data on mount
  useEffect(() => {
    if (initializing) {
      initialize()
    }
  }, [initializing, initialize])

  // Show loading screen during initial data load
  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">Loading app data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-6 px-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : (
          <AppRoutes />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App