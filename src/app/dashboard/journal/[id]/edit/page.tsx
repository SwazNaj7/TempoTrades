import { notFound } from 'next/navigation';
import { getTradeById } from '@/app/actions';
import { EditTradeForm } from '@/components/trade-view/edit-trade-form';

interface EditTradePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTradePage({ params }: EditTradePageProps) {
  const { id } = await params;
  const result = await getTradeById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <EditTradeForm trade={result.data} />
    </div>
  );
}
