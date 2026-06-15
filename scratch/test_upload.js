const ref = 'nwlhjvthqggfzvnukagg';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bGhqdnRocWdnZnp2bnVrYWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYyMDY4OCwiZXhwIjoyMDg1MTk2Njg4fQ.P3aSVSC5zhDCDMxfHnpPkUFqFYTunjrEZ5AsyXkpt14';
const bucket = 'TractorSeva';

async function main() {
  const filename = `test-${Date.now()}.png`;
  const uploadUrl = `https://${ref}.supabase.co/storage/v1/object/${bucket}/${filename}`;
  
  // 1x1 transparent PNG hex
  const hex = '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA636060600002000005000127546E820000000049454E44AE426082';
  const buffer = Buffer.from(hex, 'hex');
  
  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'apikey': key,
        'Content-Type': 'image/png'
      },
      body: buffer
    });
    
    if (!res.ok) {
      console.error('Upload failed:', res.status, await res.text());
      return;
    }
    
    const data = await res.json();
    console.log('Upload success:', data);
    
    const publicUrl = `https://${ref}.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
    console.log('Public URL:', publicUrl);
    
    // Test fetching it
    const fetchRes = await fetch(publicUrl);
    console.log('Fetched PNG status:', fetchRes.status);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
