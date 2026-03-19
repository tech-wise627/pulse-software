export type EventType = 'conference' | 'festival' | 'sports' | 'retail' | 'food' | 'cultural' | 'other';

export interface PredictionInput {
  eventName: string;
  eventType: EventType;
  expectedAttendees: number;
  eventDuration: number; // in hours
  eventDate: string;
  eventLocation: string;
}

export interface PredictionResult {
  eventName: string;
  expectedAttendees: number;
  eventDuration: number;
  predictions: {
    peakWaste: number; // kg
    totalWaste: number; // kg
    requiredBins: number;
    suggestedBinCapacity: number; // liters
    requiredStaff: number;
    cleaningCycles: number;
    estimatedCollections: number;
  };
  metrics: {
    wastePerAttendee: number; // kg/person
    wastePerHour: number; // kg/hour
    binFillRate: number; // %/hour
  };
  confidence: {
    wasteConfidence: number; // 0-100
    binsConfidence: number;
    staffConfidence: number;
  };
  recommendations: {
    binPlacement: string[];
    staffStrategy: string;
    collectionSchedule: string;
    contingencies: string[];
  };
}

// Event type multipliers based on historical data
const EVENT_MULTIPLIERS: Record<EventType, { waste: number; staffRatio: number; binCapacity: number }> = {
  conference: { waste: 0.5, staffRatio: 1 / 50, binCapacity: 120 },
  festival: { waste: 2.5, staffRatio: 1 / 30, binCapacity: 240 },
  sports: { waste: 2.0, staffRatio: 1 / 40, binCapacity: 200 },
  retail: { waste: 1.2, staffRatio: 1 / 60, binCapacity: 150 },
  food: { waste: 3.0, staffRatio: 1 / 25, binCapacity: 300 },
  cultural: { waste: 1.5, staffRatio: 1 / 45, binCapacity: 180 },
  other: { waste: 1.0, staffRatio: 1 / 50, binCapacity: 120 },
};

// Base waste generation (kg per person per hour)
const BASE_WASTE_PER_PERSON_HOUR = 0.15;

export function predictEventResources(input: PredictionInput): PredictionResult {
  const multiplier = EVENT_MULTIPLIERS[input.eventType];
  
  // Calculate waste metrics
  const wastePerAttendee = BASE_WASTE_PER_PERSON_HOUR * multiplier.waste; // kg per person per event
  const totalWaste = input.expectedAttendees * wastePerAttendee; // total kg
  const peakWaste = totalWaste * 1.3; // peak hour is 30% higher than average
  const wastePerHour = totalWaste / input.eventDuration;

  // Calculate bin requirements
  const binCapacity = multiplier.binCapacity;
  const requiredBins = Math.ceil((peakWaste * 1.2) / binCapacity); // 1.2x safety factor
  const binFillRate = (wastePerHour / binCapacity) * 100;

  // Calculate staff requirements
  const requiredStaff = Math.max(
    Math.ceil(input.expectedAttendees * multiplier.staffRatio),
    2 // minimum 2 staff
  );

  // Calculate cleaning cycles
  const cleaningCycles = Math.ceil(totalWaste / (binCapacity * 0.8)); // empty at 80% capacity
  const estimatedCollections = Math.max(Math.ceil(cleaningCycles / 2), 1);

  // Confidence scores based on event size and type
  const attendeeConfidence = Math.min(100, 70 + (input.expectedAttendees / 10000) * 20);
  const wasteConfidence = Math.round(attendeeConfidence * 0.95);
  const binsConfidence = Math.round(attendeeConfidence * 0.9);
  const staffConfidence = Math.round(attendeeConfidence * 0.85);

  // Generate recommendations
  const recommendations = generateRecommendations(
    input,
    requiredBins,
    requiredStaff,
    cleaningCycles,
    multiplier
  );

  return {
    eventName: input.eventName,
    expectedAttendees: input.expectedAttendees,
    eventDuration: input.eventDuration,
    predictions: {
      peakWaste: Math.round(peakWaste),
      totalWaste: Math.round(totalWaste),
      requiredBins,
      suggestedBinCapacity: binCapacity,
      requiredStaff,
      cleaningCycles,
      estimatedCollections,
    },
    metrics: {
      wastePerAttendee: Number(wastePerAttendee.toFixed(3)),
      wastePerHour: Number(wastePerHour.toFixed(2)),
      binFillRate: Number(binFillRate.toFixed(1)),
    },
    confidence: {
      wasteConfidence,
      binsConfidence,
      staffConfidence,
    },
    recommendations,
  };
}

function generateRecommendations(
  input: PredictionInput,
  bins: number,
  staff: number,
  cycles: number,
  multiplier: any
): PredictionResult['recommendations'] {
  const binPlacement = [];
  
  // Intelligent bin placement strategy
  if (input.eventType === 'food' || input.eventType === 'festival') {
    binPlacement.push('Place 40% near food/beverage zones');
    binPlacement.push('Place 30% near seating areas');
    binPlacement.push('Place 20% near entrance/exit');
    binPlacement.push('Place 10% for contingency/overflow');
  } else if (input.eventType === 'retail') {
    binPlacement.push('Place 50% near checkout/cashiers');
    binPlacement.push('Place 30% near restrooms');
    binPlacement.push('Place 20% at loading/service areas');
  } else {
    binPlacement.push(`Distribute ${bins} bins evenly across venue`);
    binPlacement.push('Ensure at least 1 bin every 500 sqft');
    binPlacement.push('Priority zones: restrooms, entries, exits');
  }

  const staffPerCollection = Math.ceil(1.5); // 1.5 staff per collection cycle
  const staffStrategy = `Deploy ${staff} staff total: ${Math.ceil(staff * 0.7)} during peak hours, ${Math.ceil(staff * 0.3)} for collections`;

  const collectionSchedule =
    input.eventDuration <= 4
      ? 'Single collection at 50% capacity'
      : input.eventDuration <= 8
        ? 'Collections at 60% capacity (every 2-3 hours)'
        : 'Continuous monitoring, collect when bins reach 70% capacity';

  const contingencies = [
    `Have ${Math.ceil(bins * 0.2)} additional bins on standby`,
    `Deploy additional staff if fill rate exceeds 80%/hour`,
    `Activate spillover areas if primary capacity reached`,
    `Establish backup collection points`,
  ];

  return {
    binPlacement,
    staffStrategy,
    collectionSchedule,
    contingencies,
  };
}

// Historical events for comparison
export const historicalEvents = [
  {
    id: 'hist-001',
    name: 'Tech Conference 2025',
    type: 'conference',
    attendees: 5000,
    duration: 8,
    actualWaste: 5200,
    actualBins: 35,
    actualStaff: 12,
    lessons: 'Waste was 23% higher than predicted due to more food vendors',
  },
  {
    id: 'hist-002',
    name: 'Music Festival 2025',
    type: 'festival',
    attendees: 15000,
    duration: 12,
    actualWaste: 52000,
    actualBins: 180,
    actualStaff: 45,
    lessons: 'Need 40% more collection cycles, 25% more staff',
  },
  {
    id: 'hist-003',
    name: 'Sports Day 2025',
    type: 'sports',
    attendees: 8000,
    duration: 6,
    actualWaste: 18000,
    actualBins: 90,
    actualStaff: 18,
    lessons: 'Peak waste occurred at halftime, require pre-positioned extras',
  },
  {
    id: 'hist-004',
    name: 'Food Festival 2025',
    type: 'food',
    attendees: 3500,
    duration: 5,
    actualWaste: 14000,
    actualBins: 60,
    actualStaff: 8,
    lessons: 'Organic waste requires separate bins, compost collection needed',
  },
];

export function getSimilarEvents(eventType: EventType, attendees: number) {
  return historicalEvents
    .filter((e) => e.type === eventType)
    .sort((a, b) => Math.abs(a.attendees - attendees) - Math.abs(b.attendees - attendees))
    .slice(0, 3);
}
