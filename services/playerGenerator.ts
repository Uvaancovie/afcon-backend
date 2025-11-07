import { Position, IPlayerRatings, generateRatings } from '../models/Player';

// African player names database
const FIRST_NAMES = [
  'Mohamed', 'Ahmed', 'Youssef', 'Omar', 'Ali', 'Hassan', 'Ibrahim', 'Mahmoud',
  'Sadio', 'Riyad', 'Pierre', 'Samuel', 'Victor', 'Emmanuel', 'Eric', 'Frank',
  'Achraf', 'Hakim', 'Medhi', 'Sofiane', 'Islam', 'Yassine', 'Karim', 'Walid',
  'Wilfried', 'Serge', 'Nicolas', 'Cedric', 'Andre', 'Christian', 'Joel', 'Bertrand',
  'Kelechi', 'Odion', 'John', 'Alex', 'Wilfred', 'Ahmed', 'Abdul', 'Ismail'
];

const LAST_NAMES = [
  'Salah', 'Mane', 'Mahrez', 'Ziyech', 'Aubameyang', 'Kessie', 'Partey', 'Hakimi',
  'Traore', 'Koulibaly', 'Mendy', 'Onyekuru', 'Osimhen', 'Iheanacho', 'Ndidi',
  'Belaili', 'Bennacer', 'Slimani', 'Feghouli', 'Bensebaini', 'Bounedjah',
  'Onana', 'Zambo Anguissa', 'Toko Ekambi', 'Aboubakar', 'Choupo-Moting',
  'El Shenawy', 'Elneny', 'Trezeguet', 'Afsha', 'Marmoush', 'Mostafa',
  'Boufal', 'Amrabat', 'Ounahi', 'Mazraoui', 'Aguerd', 'Saiss'
];

const AFRICAN_COUNTRIES = [
  'Egypt', 'Nigeria', 'Senegal', 'Morocco', 'Algeria',
  'Ghana', 'Cameroon', 'Tunisia', 'Ivory Coast', 'South Africa',
  'Mali', 'Burkina Faso', 'Guinea', 'Congo DR', 'Kenya'
];

// Generate a random player name
export const generatePlayerName = (): string => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
};

// Generate a full 23-player squad for a team
export const generateSquad = (teamId: string, nationality: string) => {
  const squad = [];
  const usedNumbers = new Set<number>();
  
  // Position distribution for a 23-man squad
  const positionDistribution = [
    { position: 'GK' as Position, count: 3 },
    { position: 'DF' as Position, count: 8 },
    { position: 'MD' as Position, count: 7 },
    { position: 'AT' as Position, count: 5 }
  ];
  
  let playerIndex = 0;
  let captainAssigned = false;
  
  for (const { position, count } of positionDistribution) {
    for (let i = 0; i < count; i++) {
      // Generate unique jersey number
      let jerseyNumber;
      do {
        jerseyNumber = Math.floor(Math.random() * 99) + 1;
      } while (usedNumbers.has(jerseyNumber));
      usedNumbers.add(jerseyNumber);
      
      // Assign captain to first midfielder (usually team leader)
      const isCaptain = !captainAssigned && position === 'MD' && i === 0;
      if (isCaptain) captainAssigned = true;
      
      squad.push({
        name: generatePlayerName(),
        naturalPosition: position,
        ratings: generateRatings(position),
        teamId,
        isCaptain,
        nationality,
        jerseyNumber
      });
      
      playerIndex++;
    }
  }
  
  return squad;
};

// Calculate team rating from squad
export const calculateTeamRating = (players: Array<{ ratings: IPlayerRatings }>): number => {
  if (players.length === 0) return 0;
  
  let totalRating = 0;
  players.forEach(player => {
    // Average rating across all positions for each player
    const playerAvg = (player.ratings.GK + player.ratings.DF + player.ratings.MD + player.ratings.AT) / 4;
    totalRating += playerAvg;
  });
  
  return Math.round(totalRating / players.length);
};

// Get a random African country
export const getRandomAfricanCountry = (): string => {
  return AFRICAN_COUNTRIES[Math.floor(Math.random() * AFRICAN_COUNTRIES.length)];
};

// Generate manager name
export const generateManagerName = (): string => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
};

export { AFRICAN_COUNTRIES };
