import { prisma } from '@/lib/prisma';

export async function getActiveIncident() {
  return prisma.incident.findFirst({
    where: { isActive: true },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      incidentCode: true,
      name: true,
      hazardType: true,
      description: true,
      alertLevel: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });
}

export async function getDashboardSummary() {
  const incident = await getActiveIncident();

  if (!incident) {
    const municipalityCount = await prisma.municipality.count({
      where: { province: { code: 'ILOILO' } },
    });

    return {
      incident: null,
      population: { affected: 0, displaced: 0 },
      humanImpact: { casualties: 0 },
      infrastructure: { damaged: 0, cost: 0 },
      evacuation: { centers: 0, evacuees: 0 },
      reporting: { activeReports: 0, affectedLGUs: 0, totalLGUs: municipalityCount },
      lastUpdated: new Date().toISOString(),
    };
  }

  const [sitreps, municipalityCount] = await Promise.all([
    prisma.sitrep.findMany({
      where: {
        incidentId: incident.id,
        isLatest: true,
      },
      select: {
        id: true,
        municipalityId: true,
        affectedPopulation: {
          select: {
            families: true,
            persons: true,
            evacuationCenters: true,
            personsInside: true,
            personsOutside: true,
          },
        },
        casualties: {
          where: { validated: 'YES' },
          select: { id: true },
        },
        damagedHouses: {
          select: { totalDamaged: true, amount: true },
        },
        infrastructures: {
          select: { damagedCount: true, damageCost: true },
        },
        preemptiveEvacuation: {
          select: { families: true },
        },
      },
    }),
    prisma.municipality.count({
      where: { province: { code: 'ILOILO' } },
    }),
  ]);

  const population = sitreps.flatMap(s => s.affectedPopulation);
  const damagedHouses = sitreps.flatMap(s => s.damagedHouses);
  const infrastructures = sitreps.flatMap(s => s.infrastructures);

  const affected = population.reduce((n, x) => n + x.persons, 0);
  const displaced = population.reduce((n, x) => n + x.personsInside + x.personsOutside, 0);
  const casualties = sitreps.reduce((n, x) => n + x.casualties.length, 0);
  const damaged =
    damagedHouses.reduce((n, x) => n + x.totalDamaged, 0) +
    infrastructures.reduce((n, x) => n + x.damagedCount, 0);
  const cost =
    damagedHouses.reduce((n, x) => n + Number(x.amount), 0) +
    infrastructures.reduce((n, x) => n + Number(x.damageCost), 0);
  const centers = population.reduce((n, x) => n + x.evacuationCenters, 0);
  const evacuees = displaced;

  return {
    incident: {
      ...incident,
      startDate: incident.startDate.toISOString(),
      endDate: incident.endDate?.toISOString() ?? null,
    },
    population: { affected, displaced },
    humanImpact: { casualties },
    infrastructure: { damaged, cost },
    evacuation: { centers, evacuees },
    reporting: {
      activeReports: sitreps.length,
      affectedLGUs: new Set(sitreps.map(s => s.municipalityId)).size,
      totalLGUs: municipalityCount,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function getIncidentFeed(limit = 50) {
  const incident = await getActiveIncident();
  if (!incident) return [];

  const rows = await prisma.relatedIncident.findMany({
    where: {
      sitrep: { incidentId: incident.id, isLatest: true },
    },
    orderBy: { incidentDate: 'desc' },
    take: limit,
    select: {
      id: true,
      incidentDate: true,
      incidentType: true,
      totalIncident: true,
      description: true,
      actionsTaken: true,
      status: true,
      barangay: {
        select: {
          name: true,
          latitude: true,
          longitude: true,
          municipality: { select: { name: true } },
        },
      },
    },
  });

  return rows.map(row => ({
    id: row.id,
    time: row.incidentDate.toISOString(),
    town: row.barangay.municipality.name,
    barangay: row.barangay.name,
    type: row.incidentType,
    count: row.totalIncident,
    msg: row.description,
    actionsTaken: row.actionsTaken,
    status: row.status,
    severity: inferSeverity(row.incidentType, row.description),
    lat: row.barangay.latitude ? Number(row.barangay.latitude) : null,
    lng: row.barangay.longitude ? Number(row.barangay.longitude) : null,
  }));
}

function inferSeverity(type: string, description: string) {
  const text = `${type} ${description}`.toLowerCase();
  if (/death|fatal|missing|major|severe|critical|impassable|evacuat/.test(text)) return 'High' as const;
  if (/damage|blocked|flood|landslide|interrupted|partial/.test(text)) return 'Medium' as const;
  return 'Low' as const;
}

export async function getMapData() {
  const incident = await getActiveIncident();
  if (!incident) return { incident: null, markers: [] };

  const rows = await prisma.affectedPopulation.findMany({
    where: { sitrep: { incidentId: incident.id, isLatest: true } },
    select: {
      id: true,
      families: true,
      persons: true,
      evacuationCenters: true,
      personsInside: true,
      personsOutside: true,
      barangay: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          municipality: { select: { name: true } },
        },
      },
    },
  });

  const markers = rows
    .filter(r => r.barangay.latitude != null && r.barangay.longitude != null)
    .map(r => ({
      id: r.id,
      lat: Number(r.barangay.latitude),
      lng: Number(r.barangay.longitude),
      name: `${r.barangay.name}, ${r.barangay.municipality.name}`,
      type: r.evacuationCenters > 0 ? 'Affected / Evacuation Area' : 'Affected Area',
      desc: `${r.persons.toLocaleString()} persons affected; ${r.families.toLocaleString()} families. ${r.evacuationCenters.toLocaleString()} evacuation center(s) reported.`,
      severity: r.persons >= 1000 ? 'High' : r.persons >= 250 ? 'Medium' : 'Low',
      evacuation: r.evacuationCenters > 0,
      affected: r.persons,
      timestamp: incident.name,
    }));

  return {
    incident: { id: incident.id, name: incident.name },
    markers,
  };
}
