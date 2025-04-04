// supabaseClient.js
// This file handles all interactions with the Supabase database

// Initialize Supabase client
let supabase;

// Wrapper to ensure Supabase is initialized before use
async function initSupabase() {
    if (supabase) return supabase;
    
    try {
        // Create Supabase client
        supabase = window.supabase.createClient(
            'https://npvjrkjpxdcbjuaoqqul.supabase.co',  // Replace with your actual URL
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdmpya2pweGRjYmp1YW9xcXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODEwMTUsImV4cCI6MjA1OTM1NzAxNX0.f0nfehpBqYDm1SGLKpJAoch-ZXiJMLYQSwdY2OSYHPo'                 // Replace with your actual anon key
        );
        console.log('Supabase client initialized successfully');
        return supabase;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

// User nickname management
export function getUserNickname() {
    return localStorage.getItem('userNickname');
}

export function setUserNickname(nickname) {
    localStorage.setItem('userNickname', nickname);
    return nickname;
}

export function hasUserNickname() {
    return !!getUserNickname();
}

// Set the user nickname header for Row Level Security
function setAuthHeader(client) {
    const nickname = getUserNickname();
    if (nickname) {
        client.headers = {
            ...client.headers,
            'x-user-nickname': nickname
        };
    }
    return client;
}

// Map management
export async function fetchMaps(sortBy = 'created_at', ascending = false) {
    try {
        const client = await initSupabase();
        if (!client) return [];
        
        // Set auth header
        setAuthHeader(client);
        
        const { data, error } = await client
            .from('maps')
            .select('*')
            .order(sortBy, { ascending });
        
        if (error) {
            console.error('Error fetching maps:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error in fetchMaps:', error);
        return [];
    }
}

export async function getMapById(id) {
    try {
        const client = await initSupabase();
        if (!client) return null;
        
        // Set auth header
        setAuthHeader(client);
        
        const { data, error } = await client
            .from('maps')
            .select('*')
            .eq('id', id);
        
        if (error) {
            console.error('Error fetching map by ID:', error);
            return null;
        }
        
        // Return the first map if found, otherwise null
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error in getMapById:', error);
        return null;
    }
}

export async function saveMapToSupabase(mapData) {
    try {
        const client = await initSupabase();
        if (!client) return null;
        
        const nickname = getUserNickname() || 'Anonymous';
        
        // Set auth header
        setAuthHeader(client);
        
        const { data, error } = await client
            .from('maps')
            .upsert({
                name: mapData.name,
                map_data: mapData,
                author: nickname
            })
            .select();
        
        if (error) {
            console.error('Error saving map:', error);
            return null;
        }
        
        return data?.[0] || null;
    } catch (error) {
        console.error('Error in saveMapToSupabase:', error);
        return null;
    }
}

export async function deleteMapFromSupabase(mapId) {
    try {
        const client = await initSupabase();
        if (!client) return false;
        
        // Set auth header
        setAuthHeader(client);
        
        const { error } = await client
            .from('maps')
            .delete()
            .eq('id', mapId);
        
        if (error) {
            console.error('Error deleting map:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error in deleteMapFromSupabase:', error);
        return false;
    }
}

// Map rating
export async function rateMap(mapId, rating) {
    try {
        const client = await initSupabase();
        if (!client) return false;
        
        const nickname = getUserNickname();
        if (!nickname) return false;
        
        // Set auth header
        setAuthHeader(client);
        
        const { error } = await client
            .from('ratings')
            .upsert({
                map_id: mapId,
                user_nickname: nickname,
                rating
            });
        
        if (error) {
            console.error('Error rating map:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error in rateMap:', error);
        return false;
    }
}

export async function getUserMapRating(mapId) {
    try {
        const client = await initSupabase();
        if (!client) return 0;
        
        const nickname = getUserNickname();
        if (!nickname) return 0;
        
        // Set auth header
        setAuthHeader(client);
        
        const { data, error } = await client
            .from('ratings')
            .select('rating')
            .eq('map_id', mapId)
            .eq('user_nickname', nickname);
        
        if (error) {
            console.error('Error fetching user rating:', error);
            return 0;
        }
        
        // Return the first rating if found, otherwise 0
        return data && data.length > 0 ? data[0].rating : 0;
    } catch (error) {
        console.error('Error in getUserMapRating:', error);
        return 0;
    }
} 