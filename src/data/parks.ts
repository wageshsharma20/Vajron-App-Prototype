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
    id: 'rohini-dda',
    name: 'Rohini DDA Park',
    locality: 'Rohini',
    status: 'ready',
    surveyDate: '22 May 2026',
    clip: '3-clip survey',
    zone: 'Lawns, gazebo & hedge beds · lake & open water · algal channel & banks',
    durationSec: 110.91,
  },
  {
    id: 'sanjay-lake',
    name: 'Sanjay Lake',
    locality: 'East Delhi',
    status: 'ready',
    surveyDate: '19 May 2026',
    clip: '5-clip survey',
    zone: 'Play area · lake edge · open-gym & lawns · footbridge · works zone',
    durationSec: 218.49,
  },
  {
    id: 'lala-harydal',
    name: 'Lala Harydal Park',
    locality: 'North Delhi',
    status: 'ready',
    surveyDate: '19 May 2026',
    clip: '3-clip survey',
    zone: 'Palm avenue & lawns · formal beds & pathways · central axis & parterre',
    durationSec: 147.42,
  },
  {
    id: 'smriti-van-mayur-vihar',
    name: 'Smriti Van Mayur Vihar',
    locality: 'Mayur Vihar',
    status: 'ready',
    surveyDate: '19 May 2026',
    clip: '4-clip survey',
    zone: 'Flooded planting bed · play area · waterlogged ground · lawns & tree belt',
    durationSec: 136.57,
  },
  {
    id: 'r-block-asaf-ali',
    name: 'R Block Asaf Ali Park',
    locality: 'Asaf Ali Road',
    status: 'ready',
    surveyDate: '18 May 2026',
    clip: '2-clip survey',
    zone: 'Garden & tree canopy · pavilion (close-range)',
    durationSec: 105.19,
  },
  {
    id: 'vasant-udyan',
    name: 'Vasant Udyan',
    locality: 'Vasant Kunj',
    status: 'ready',
    surveyDate: '18 May 2026',
    clip: '2-clip survey',
    zone: "Children's play area · pathways & tree belt",
    durationSec: 71.53,
  },
  {
    id: 'vasant-vatika',
    name: 'Vasant Vatika',
    locality: 'Vasant Kunj',
    status: 'ready',
    surveyDate: '20 May 2026',
    clip: '3-clip survey',
    zone: 'Fountain & formal garden · central lawn & avenue · open gym & hedge beds',
    durationSec: 113.21,
  },
];

/** The park whose survey is loaded when the app opens. */
export const DEFAULT_PARK_ID = 'rohini-dda';

export const parkById = (id: string): Park =>
  PARKS.find((p) => p.id === id) ?? PARKS[0];

/**
 * A single playable recording within a park. A ready park can carry more than one
 * (e.g. Sanjay Lake has both the four-clip park survey and the works-zone clip),
 * each backed by its own detection dataset and video file. `datasetId` selects
 * which replay dataset drives the whole app while this recording plays; `video`
 * is the file basename served locally (web) and from the GitHub release (native).
 */
export type Recording = {
  id: string;
  label: string;
  sublabel: string;
  datasetId:
    | 'survey'
    | 'smriti-van-1'
    | 'smriti-van-2'
    | 'smriti-van-3'
    | 'smriti-van-4'
    | 'lala-1'
    | 'lala-2'
    | 'lala-3'
    | 'asaf-1'
    | 'asaf-2'
    | 'vasant-1'
    | 'vasant-2'
    | 'vatika-1'
    | 'vatika-2'
    | 'vatika-3'
    | 'rohini-1'
    | 'rohini-2'
    | 'rohini-3';
  video: string;
  durationSec: number;
};

export const RECORDINGS: Record<string, Recording[]> = {
  // One recording, not two. The works-zone clip used to be a second entry that
  // the player chained to when the survey ended — which meant a source swap, a
  // reload and a visible break mid-survey. The five clips are now a single MP4
  // on a single clock, so the works zone simply arrives at 3:00 like any other
  // part of the flight.
  'sanjay-lake': [
    {
      id: 'survey',
      label: 'Full Park Survey',
      sublabel: 'Play area · lake edge · open-gym & lawns · footbridge · works zone',
      datasetId: 'survey',
      video: 'sanjay-lake-full.mp4',
      durationSec: 218.49,
    },
  ],
  // Four separate clip recordings, chained in order so they play as one
  // continuous survey — each carries its own zone's dataset and notifications.
  'lala-harydal': [
    {
      id: 'clip1',
      label: 'Palm Avenue & Lawns',
      sublabel: 'Palm avenue and lawns · 76 s',
      datasetId: 'lala-1',
      video: 'lala-hardeval-01.mp4',
      durationSec: 76.28,
    },
    {
      id: 'clip2',
      label: 'Formal Beds & Pathways',
      sublabel: 'Formal beds and pathways · 47 s',
      datasetId: 'lala-2',
      video: 'lala-hardeval-02.mp4',
      durationSec: 47.36,
    },
    {
      id: 'clip3',
      label: 'Central Axis & Parterre',
      sublabel: 'Central axis and parterre · 24 s',
      datasetId: 'lala-3',
      video: 'lala-hardeval-03.mp4',
      durationSec: 23.78,
    },
  ],
  'r-block-asaf-ali': [
    {
      id: 'clip1',
      label: 'Garden & Tree Canopy',
      sublabel: 'Garden and tree canopy · 64 s',
      datasetId: 'asaf-1',
      video: 'asaf-ali-01.mp4',
      durationSec: 64.48,
    },
    {
      id: 'clip2',
      label: 'Pavilion',
      sublabel: 'Pavilion, close range · 41 s',
      datasetId: 'asaf-2',
      video: 'asaf-ali-02.mp4',
      durationSec: 40.71,
    },
  ],
  'vasant-udyan': [
    {
      id: 'clip1',
      label: "Children's Play Area",
      sublabel: "Children's play area · 42 s",
      datasetId: 'vasant-1',
      video: 'vasant-udyan-01.mp4',
      durationSec: 41.68,
    },
    {
      id: 'clip2',
      label: 'Pathways & Tree Belt',
      sublabel: 'Pathways and tree belt · 30 s',
      datasetId: 'vasant-2',
      video: 'vasant-udyan-02.mp4',
      durationSec: 29.85,
    },
  ],
  'smriti-van-mayur-vihar': [
    {
      id: 'clip1',
      label: 'Flooded Planting Bed',
      sublabel: 'Flooded planting bed zone · 17 s',
      datasetId: 'smriti-van-1',
      video: 'smriti-van-01.mp4',
      durationSec: 17.11,
    },
    {
      id: 'clip2',
      label: "Children's Play Area",
      sublabel: "Children's play area · 46 s",
      datasetId: 'smriti-van-2',
      video: 'smriti-van-02.mp4',
      durationSec: 45.94,
    },
    {
      id: 'clip3',
      label: 'Waterlogged Ground',
      sublabel: 'Waterlogged open ground · 35 s',
      datasetId: 'smriti-van-3',
      video: 'smriti-van-03.mp4',
      durationSec: 35.04,
    },
    {
      id: 'clip4',
      label: 'Lawns & Tree Belt',
      sublabel: 'Lawns and tree belt zone · 38 s',
      datasetId: 'smriti-van-4',
      video: 'smriti-van-04.mp4',
      durationSec: 38.48,
    },
  ],
  'vasant-vatika': [
    {
      id: 'clip1',
      label: 'Fountain & Formal Garden',
      sublabel: 'Fountain and formal garden · 11 s',
      datasetId: 'vatika-1',
      video: 'vasant-vatika-01.mp4',
      durationSec: 10.68,
    },
    {
      id: 'clip2',
      label: 'Central Lawn & Avenue',
      sublabel: 'Central lawn and avenue · 39 s',
      datasetId: 'vatika-2',
      video: 'vasant-vatika-02.mp4',
      durationSec: 38.95,
    },
    {
      id: 'clip3',
      label: 'Open Gym & Hedge Beds',
      sublabel: 'Open gym and hedge beds · 64 s',
      datasetId: 'vatika-3',
      video: 'vasant-vatika-03.mp4',
      durationSec: 63.58,
    },
  ],
  'rohini-dda': [
    {
      id: 'clip1',
      label: 'Lawns, Gazebo & Hedge Beds',
      sublabel: 'Lawns, gazebo and hedge beds · 37 s',
      datasetId: 'rohini-1',
      video: 'rohini-dda-01.mp4',
      durationSec: 36.88,
    },
    {
      id: 'clip2',
      label: 'Lake & Open Water',
      sublabel: 'Lake and open water zone · 26 s',
      datasetId: 'rohini-2',
      video: 'rohini-dda-02.mp4',
      durationSec: 26.18,
    },
    {
      id: 'clip3',
      label: 'Algal Channel & Banks',
      sublabel: 'Algal channel and banks · 48 s',
      datasetId: 'rohini-3',
      video: 'rohini-dda-03.mp4',
      durationSec: 47.85,
    },
  ],
};

export const recordingsForPark = (parkId: string): Recording[] => RECORDINGS[parkId] ?? [];

export const DEFAULT_RECORDING_ID = 'survey';
