import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('--- Checking for Missing Tags/Subcategories ---');
    const { data, error } = await supabase.from('menu_items')
        .select('name, category, subcategory, tags')
        .order('name');

    if (error) {
        console.error('Error fetching data:', error);
    } else if (data.length > 0) {
        // Collect issues
        let missingSub = 0;
        let missingTags = 0;
        data.forEach(item => {
            if (!item.subcategory) missingSub++;
            if (!item.tags || item.tags.length === 0) missingTags++;
        });

        console.log(`Total items: ${data.length}`);
        console.log(`Missing Subcategory count: ${missingSub}`);
        console.log(`Empty Tags count: ${missingTags}`);

        if (missingSub > 0 || missingTags > 0) {
            console.log('CRITICAL: The database schema is missing required columns or they are empty.');
            console.log('Sample item with issue:');
            const bad = data.find(i => !i.subcategory || !i.tags || i.tags.length === 0);
            if (bad) console.log(JSON.stringify(bad, null, 2));
        } else {
            console.log('SUCCESS: All items appear to have subcategories and tags!');
        }
    } else {
        console.log('Table is empty.');
    }
}

check();
