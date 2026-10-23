import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const BASE_URL = 'https://api.jolpi.ca/ergast/f1'

const delay = (ms) => new Promise(res => setTimeout(res, ms))

async function fetchWithRetry(url, retries = 5, backoff = 2000) {
    try {
        return await axios.get(url);
    } catch (err) {
        if (err.response && err.response.status === 429 && retries > 0) {
            console.log(`Rate limited on ${url}. Retrying in ${backoff}ms...`);
            await delay(backoff);
            return fetchWithRetry(url, retries - 1, backoff * 1.5);
        }
        throw err;
    }
}

async function fetchAllPaginated(urlPath, dataPath) {
    let allData = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const url = `${BASE_URL}${urlPath}?limit=${limit}&offset=${offset}`;
        const res = await fetchWithRetry(url);

        let pathParts = dataPath.split('.');
        let dataArray = res.data;
        for (const part of pathParts) {
            if (dataArray == null) break;
            dataArray = dataArray[part];
        }

        if (!dataArray || dataArray.length === 0) {
            break;
        }

        allData = allData.concat(dataArray);

        const total = parseInt(res.data.MRData.total);
        if (allData.length >= total) {
            break;
        }
        offset += limit;
        await delay(500); // small delay between pages to be safe
    }
    return allData;
}

// --- FETCH ALL SEASONS ---
async function fetchSeasons() {
    const seasons = await fetchAllPaginated('/seasons.json', 'MRData.SeasonTable.Seasons')
    return seasons.map(s => s.season)
}

// --- SEED CONSTRUCTORS ---
async function seedConstructors() {
    console.log('Seeding constructors...')
    const constructors = await fetchAllPaginated('/constructors.json', 'MRData.ConstructorTable.Constructors')

    const rows = constructors.map(c => ({
        id: c.constructorId,
        name: c.name,
        full_name: c.name,
        nationality: c.nationality,
        color_primary: '#ffffff',
        color_secondary: '#000000',
    }))

    // Upsert in batches to avoid Supabase limits
    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from('constructors').upsert(batch)
        if (error) console.error('Constructors error:', error)
    }
    console.log(`✓ ${rows.length} constructors seeded`)
}

// --- SEED DRIVERS ---
async function seedDrivers() {
    console.log('Seeding drivers...')
    const drivers = await fetchAllPaginated('/drivers.json', 'MRData.DriverTable.Drivers')

    const rows = drivers.map(d => ({
        id: d.driverId,
        name: `${d.givenName} ${d.familyName}`,
        given_name: d.givenName,
        family_name: d.familyName,
        nationality: d.nationality,
        dob: d.dateOfBirth || null,
    }))

    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from('drivers').upsert(batch)
        if (error) console.error('Drivers error:', error)
    }
    console.log(`✓ ${rows.length} drivers seeded`)
}

// --- SEED CIRCUITS ---
async function seedCircuits() {
    console.log('Seeding circuits...')
    const circuits = await fetchAllPaginated('/circuits.json', 'MRData.CircuitTable.Circuits')

    const rows = circuits.map(c => ({
        id: c.circuitId,
        name: c.circuitName,
        country: c.Location.country,
        city: c.Location.locality,
    }))

    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from('circuits').upsert(batch)
        if (error) console.error('Circuits error:', error)
    }
    console.log(`✓ ${rows.length} circuits seeded`)
}

// --- SEED SEASONS + RESULTS ---
async function seedSeasonsAndResults(targetYear = null) {
    const seasons = targetYear ? [targetYear] : await fetchSeasons()
    console.log(`Found ${seasons.length} seasons to seed...`)

    for (const year of seasons) {
        console.log(`\nProcessing ${year}...`)
        await delay(1000) // be nice to the API

        try {
            // Season standings for WCC and WDC
            // Fetch sequentially to minimize burst rate limit hits
            const driverStandingsRes = await fetchWithRetry(`${BASE_URL}/${year}/driverStandings/1.json`)
            await delay(300)
            const constructorStandingsRes = await fetchWithRetry(`${BASE_URL}/${year}/constructorStandings/1.json`)

            const wdc = driverStandingsRes.data.MRData.StandingsTable
                .StandingsLists[0]?.DriverStandings[0]?.Driver.driverId || null
            const wcc = constructorStandingsRes.data.MRData.StandingsTable
                .StandingsLists[0]?.ConstructorStandings[0]?.Constructor.constructorId || null

            const { error: seasonError } = await supabase.from('seasons').upsert({
                year: parseInt(year),
                wdc_driver_id: wdc,
                wcc_constructor_id: wcc,
            })

            if (seasonError) {
                console.error(`Season insert failed for ${year}:`, seasonError)
                continue
            }

            console.log(`Clearing existing data for ${year} to prevent duplicates...`)
            await supabase.from('race_results').delete().eq('season_year', parseInt(year))
            await supabase.from('season_entries').delete().eq('season_year', parseInt(year))

            // Race results for the season
            await delay(300)
            const races = await fetchAllPaginated(`/${year}/results.json`, 'MRData.RaceTable.Races')

            const resultRows = []
            const entryMap = {} // track unique driver+constructor per season

            for (const race of races) {
                for (const result of race.Results) {
                    resultRows.push({
                        season_year: parseInt(year),
                        circuit_id: race.Circuit.circuitId,
                        driver_id: result.Driver.driverId,
                        constructor_id: result.Constructor.constructorId,
                        position: result.position === 'R' ? null : parseInt(result.position),
                        points: parseFloat(result.points),
                        fastest_lap: result.FastestLap?.rank === '1' || false,
                        dnf: result.status !== 'Finished' && !result.status.includes('Lap'),
                    })

                    const key = `${result.Driver.driverId}_${result.Constructor.constructorId}`
                    entryMap[key] = {
                        season_year: parseInt(year),
                        driver_id: result.Driver.driverId,
                        constructor_id: result.Constructor.constructorId,
                    }
                }
            }

            if (resultRows.length) {
                const batchSize = 200;
                for (let i = 0; i < resultRows.length; i += batchSize) {
                    const batch = resultRows.slice(i, i + batchSize);
                    const { error } = await supabase.from('race_results').upsert(batch)
                    if (error) console.error(`Race results error ${year}:`, error)
                }
            }

            // Season entries
            const entryRows = Object.values(entryMap)
            if (entryRows.length) {
                const batchSize = 200;
                for (let i = 0; i < entryRows.length; i += batchSize) {
                    const batch = entryRows.slice(i, i + batchSize);
                    const { error } = await supabase.from('season_entries').upsert(batch)
                    if (error) console.error(`Season entries error ${year}:`, error)
                }
            }

            console.log(`✓ ${year} done — ${races.length} races, ${resultRows.length} results`)

        } catch (err) {
            console.error(`Failed ${year}:`, err.message)
        }
    }
}

async function seedStandings(targetYear = null) {
    console.log('\nSeeding driver standings...')

    let query = supabase.from('seasons').select('year').order('year', { ascending: true })
    if (targetYear) {
        query = query.eq('year', targetYear)
    }

    const { data: seasons } = await query

    for (const { year } of seasons) {
        await delay(1000)
        try {
            const res = await axios.get(`${BASE_URL}/${year}/driverStandings.json?limit=100`)
            const standingsList = res.data.MRData.StandingsTable.StandingsLists[0]
            if (!standingsList) continue

            for (const standing of standingsList.DriverStandings) {
                const driverId = standing.Driver.driverId
                const constructorId = standing.Constructors[0]?.constructorId
                if (!driverId || !constructorId) continue

                const { error } = await supabase
                    .from('season_entries')
                    .update({
                        championship_position: parseInt(standing.position),
                        points: parseFloat(standing.points),
                    })
                    .eq('season_year', year)
                    .eq('driver_id', driverId)
                    .eq('constructor_id', constructorId)

                if (error) console.error(`Standings error ${year} ${driverId}:`, error.message)
            }

            console.log(`✓ ${year} standings updated`)
        } catch (err) {
            console.error(`Failed standings ${year}:`, err.message)
        }
    }
}

// --- RUN ---
async function main() {
    const args = process.argv.slice(2);
    const targetYear = args[0] ? parseInt(args[0]) : null;

    if (targetYear) {
        console.log(`\n🚀 Updating data ONLY for season ${targetYear}...`)
    } else {
        console.log(`\n⚠️ No year specified, updating ALL seasons. This will take a while.`)
    }

    // Run basic entity updates just in case new drivers/teams debuted mid-season
    if (targetYear) {
        await seedConstructors()
        await seedDrivers()
        // await seedCircuits() // circuits rarely change mid-season, can leave commented out
    } else {
        // await seedConstructors()
        // await seedDrivers()
        // await seedCircuits()
    }

    await seedSeasonsAndResults(targetYear)
    await seedStandings(targetYear)
    
    console.log('\n✅ All done!')
}

main()