// loadEvents.js
// Fetches and parses the events.csv file, returns a sorted array of events

let upcomingCache = undefined;
let pastCache = undefined;

// filter is 'upcoming' or 'past'
export async function loadEvents(filter = "upcoming") {
    if (filter === "upcoming" && upcomingCache) {
        return upcomingCache;
    } else if (filter === "past" && pastCache) {
        return pastCache;
    }

    if (typeof Papa === "undefined") {
        throw new Error("PapaParse library not loaded. Include it before calling loadEvents().");
    }

    const res = await fetch("events.csv");
    if (!res.ok) throw new Error(`Failed to load ${csvPath}`);

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
    let events = parsed.data.filter((e) => e.name && e.year && e.month && e.day && e.link);
    // Trim (remove whitespaces left and right)
    events = events.map((e) => Object.fromEntries(Object.entries(e).map(([key, value]) => [key, value.trim()])));

    const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    // month is from 1-12 in csv but in months array and Date object from 0-11
    events = events.map((e) => {
        // if event has no date yet, 0 is considered as no date
        if (e.day === "0" || e.month === "0" || e.year === "0") {
            return {
                name: e.name,
                day: "0",
                month: "0",
                year: "0",
                link: e.link,
                timestamp: Infinity,
            };
        } else {
            return {
                name: e.name,
                day: e.day,
                month: months[e.month - 1],
                year: e.year,
                link: e.link,
                timestamp: new Date(e.year, e.month - 1, e.day).getTime(),
            };
        }
    });

    const nowTimestamp = new Date().getTime();

    const upcoming = events.filter((e) => e.timestamp >= nowTimestamp).sort((a, b) => a.timestamp - b.timestamp);
    const past = events.filter((e) => e.timestamp < nowTimestamp).sort((a, b) => b.timestamp - a.timestamp);

    // Save events
    upcomingCache = upcoming;
    pastCache = past;

    if (filter === "upcoming") {
        return upcomingCache;
    } else if (filter === "past") {
        return pastCache;
    }
}
