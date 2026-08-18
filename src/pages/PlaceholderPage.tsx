import { useNavigate } from 'react-router-dom'
import { AppBar, Screen } from '../components/ui'

/** Pantalla temporal para flujos que se construiran en fases posteriores. */
export function PlaceholderPage({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <Screen>
      <AppBar
        title={title}
        right={
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-400 hover:text-slate-200"
          >
            Menu
          </button>
        }
      />
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <p className="text-sm text-slate-500">
          Esta pantalla se construira en la siguiente fase.
        </p>
      </div>
    </Screen>
  )
}
