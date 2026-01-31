import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { ClientDossier } from '@/components/ClientDossier';
import type { PilotClient, TaskForce } from '@/lib/types';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDossierPage({ params }: PageProps) {
  const { id } = await params;
  const clientId = parseInt(id, 10);

  if (isNaN(clientId) || clientId < 1 || clientId > 4) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  // Fetch client
  const { data: client, error } = await supabase
    .from('pilot_clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  // Fetch assigned task force
  const { data: taskForce } = await supabase
    .from('task_forces')
    .select('*')
    .eq('client_id', clientId)
    .single();

  return (
    <ClientDossier
      client={client as PilotClient}
      taskForce={taskForce as TaskForce | null}
    />
  );
}

// Generate static params for all clients
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
  ];
}
