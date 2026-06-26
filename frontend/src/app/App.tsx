import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter', fontSize: 14, borderRadius: 12 },
        }}
        theme="light"
        richColors
      />
    </>
  );
}
