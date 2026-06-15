const ref = 'nwlhjvthqggfzvnukagg';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bGhqdnRocWdnZnp2bnVrYWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYyMDY4OCwiZXhwIjoyMDg1MTk2Njg4fQ.P3aSVSC5zhDCDMxfHnpPkUFqFYTunjrEZ5AsyXkpt14';

async function main() {
  const url = `https://${ref}.supabase.co/storage/v1/bucket`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'apikey': key
      }
    });
    if (!res.ok) {
      console.error('Failed to fetch buckets:', res.status, await res.text());
      return;
    }
    const buckets = await res.json();
    console.log('Buckets list:', buckets);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
