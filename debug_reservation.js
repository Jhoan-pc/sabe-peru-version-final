
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file to get variables
const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find SUPABASE URL or KEY in .env");
    process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseAnonKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReservation() {
    console.log('Attempting to insert test reservation...');

    const reservation = {
        customer_name: 'Test Debugger',
        customer_email: 'test@example.com',
        reservation_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        reservation_time: '20:00:00', // HH:MM:SS
        number_of_people: 2,
        occasion: 'Debugging',
        status: 'pending'
    };

    console.log('Payload:', reservation);

    const { data: insertData, error: insertError } = await supabase
        .from('reservations')
        .insert([reservation])
        .select();

    if (insertError) {
        console.error('FAILED TO INSERT:', insertError);
        console.error('Details:', JSON.stringify(insertError, null, 2));
    } else {
        console.log('SUCCESS! Reservation inserted:', insertData);
        // Clean up
        const { error: deleteError } = await supabase.from('reservations').delete().eq('id', insertData[0].id);
        if (deleteError) {
            console.error('Warning: Could not delete test reservation', deleteError);
        } else {
            console.log('Test reservation cleaned up.');
        }
    }
}

testReservation();
