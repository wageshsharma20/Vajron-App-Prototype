export interface ChecklistItem {
  id: string;
  name: string;
  status: 'good' | 'attention' | 'issue';
  value: string;
  severity: string;
}

export interface InspectionCategory {
  id: string;
  category: string;
  iconName: string;
  issueCount: number;
  status: string;
  items: ChecklistItem[];
}

export interface ScoreData {
  id: string;
  label: string;
  score: number;
  icon: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface ChangeDetectionData {
  id: string;
  metric: string;
  previousValue: string;
  currentValue: string;
  change: number;
  unit: string;
  trend: 'improved' | 'declined' | 'stable';
}

export interface ParkInfo {
  parkName: string;
  location: string;
  surveyDate: string;
  surveyTime: string;
  areaCovered: string;
  totalArea: string;
  altitude: string;
  speed: string;
  heading: string;
  battery: number;
  flightTime: string;
}

export interface BoundingBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  type: 'live' | 'ghost';
  category: 'issue' | 'neutral' | 'target';
}
