import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpecificBucket(bucketName) {
    console.log(`\n--- Checking bucket: '${bucketName}' ---`);
    const { data, error } = await supabase.storage.from(bucketName).list();

    if (error) {
        console.error(`Error listing '${bucketName}':`, error.message);
    } else {
        console.log(`Files found in '${bucketName}': ${data.length}`);
        data.forEach(f => console.log(`- ${f.name} (${(f.metadata?.size / 1024).toFixed(2)} KB)`));
    }
}

async function check() {
    await checkSpecificBucket('gallery');
    await checkSpecificBucket('galeria');
    await checkSpecificBucket('public');
    await checkSpecificBucket('bucket');
}

check();
