import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BookingLayout } from '../features/booking/ui/BookingLayout'
import { SearchPage } from '../features/booking/ui/SearchPage'
import { ResultsPage } from '../features/booking/ui/ResultsPage'
import { RoomDetailsPage } from '../features/booking/ui/RoomDetailsPage'
import { CheckoutPage } from '../features/booking/ui/CheckoutPage'
import { ConfirmationPage } from '../features/booking/ui/ConfirmationPage'

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<BookingLayout />}>
          <Route index element={<SearchPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="room/:roomId" element={<RoomDetailsPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

