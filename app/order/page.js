import OrderForm from '@/components/client/OrderForm';
import { Suspense } from 'react';

function OrderFormWrapper() {
  return <OrderForm />;
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderFormWrapper />
    </Suspense>
  );
}
