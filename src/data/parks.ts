/**
 * Parks onboarded to the survey programme.
 *
 * Only Sanjay Lake Park has a processed survey in this build: its recording and
 * the full detection dataset it drives come from the 19 May 2026 flight. The other
 * sites are listed as scheduled — they deliberately carry no scores, because
 * inventing findings for a park that has not been flown would misrepresent the
 * survey. Drop a recording + dataset in and flip `status` to 'ready'.
 *
 * Edit this list to change which parks appear in the Recordings tab.
 */

export type ParkStatus = 'ready' | 'scheduled';

export type Park = {
  id: string;
  name: string;
  locality: string;
  status: ParkStatus;
  /** Populated only when status is 'ready'. */
  surveyDate?: string;
  clip?: string;
  zone?: string;
  durationSec?: number;
};

export const PARKS: Park[] = [
  {
    id: 'sanjay-lake',
    name: 'Sanjay Lake Park',
    locality: 'East Delhi',
    status: 'ready',
    surveyDate: '19 May 2026',
    clip: '4-clip survey',
    zone: 'Play area · lake edge · open-gym & lawns · footbridge',
    durationSec: 180.45,
  },
  { id: 'lala-hardyal', name: 'Lala Hardyal Park', locality: 'North Delhi', status: 'scheduled' },
  { id: 'smriti-van', name: 'Smriti Van', locality: 'Vasant Kunj', status: 'scheduled' },
  { id: 'sanjay-van', name: 'Sanjay Van', locality: 'Mehrauli', status: 'scheduled' },
  { id: 'japanese-park', name: 'Japanese Park', locality: 'Rohini', status: 'scheduled' },
  { id: 'jahanpanah', name: 'Jahanpanah City Forest', locality: 'Chirag Delhi', status: 'scheduled' },
  { id: 'hauz-khas', name: 'Hauz Khas District Park', locality: 'Hauz Khas', status: 'scheduled' },
];

/** The park whose survey is loaded when the app opens. */
export const DEFAULT_PARK_ID = 'sanjay-lake';

export const parkById = (id: string): Park =>
  PARKS.find((p) => p.id === id) ?? PARKS[0];
