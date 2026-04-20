import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('--- Checking for Duplicates ---');
    const { data, error } = await supabase
        .from('menu_items')
        .select('name, tags, id')
        .order('name');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Total items: ${data.length}`);

        // Print distinct subcategories
        const subs = [...new Set(data.map(i => i.subcategory))];
        console.log('Subcategories found:', subs);

        // Print first 5 items with tags
        console.log('Sample items:');
        data.slice(0, 5).forEach(item => {
            console.log(`- ${item.name}: Sub=${item.subcategory}, Tags=${JSON.stringify(item.tags)}`);
        });
    }
}

check();
