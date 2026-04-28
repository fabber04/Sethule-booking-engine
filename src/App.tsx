import { AppRouter } from './app/AppRouter'
import { BookingProvider } from './features/booking/BookingProvider'

export default function App() {
  return (
    <BookingProvider>
      <AppRouter />
    </BookingProvider>
  )
}
