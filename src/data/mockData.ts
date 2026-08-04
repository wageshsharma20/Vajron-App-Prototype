export const mockChangeDetection = [
  {
    "id": "green-cover",
    "metric": "Green Cover",
    "previousValue": "74%",
    "currentValue": "78%",
    "unit": "%",
    "change": 4,
    "trend": "improved"
  },
  {
    "id": "new-plantation-survival",
    "metric": "New Plantation Survival",
    "previousValue": "85%",
    "currentValue": "88%",
    "unit": "%",
    "change": 3,
    "trend": "improved"
  },
  {
    "id": "tree-canopy-growth",
    "metric": "Tree Canopy Growth",
    "previousValue": "65%",
    "currentValue": "68%",
    "unit": "%",
    "change": 3,
    "trend": "improved"
  },
  {
    "id": "damaged-infrastructure",
    "metric": "Damaged Infrastructure",
    "previousValue": "8 items",
    "currentValue": "5 items",
    "unit": "items",
    "change": -3,
    "trend": "improved"
  },
  {
    "id": "encroachment",
    "metric": "Encroachment",
    "previousValue": "0",
    "currentValue": "1",
    "unit": "incidents",
    "change": 1,
    "trend": "declined"
  },
  {
    "id": "cleanliness-score",
    "metric": "Cleanliness Score",
    "previousValue": "65",
    "currentValue": "58",
    "unit": "/100",
    "change": -7,
    "trend": "declined"
  },
  {
    "id": "work-completion",
    "metric": "Work Completion",
    "previousValue": "72%",
    "currentValue": "84%",
    "unit": "%",
    "change": 12,
    "trend": "improved"
  },
  {
    "id": "lawn-health",
    "metric": "Lawn Health",
    "previousValue": "69%",
    "currentValue": "65%",
    "unit": "%",
    "change": -4,
    "trend": "declined"
  }
];

export const mockInspection = [
  {
    "id": "asset-inventory",
    "category": "Asset Inventory",
    "iconName": "MapPin",
    "issueCount": 0,
    "status": "good",
    "items": [
      {
        "id": "gps-location",
        "name": "Asset GPS Locations",
        "status": "good",
        "value": "100% geo-tagged",
        "severity": "low"
      },
      {
        "id": "tree-geotagging",
        "name": "Tree Geo-tagging",
        "status": "good",
        "value": "1,247 trees tagged",
        "severity": "low"
      },
      {
        "id": "bench-count",
        "name": "Benches",
        "status": "good",
        "value": "84 units mapped",
        "severity": "low"
      },
      {
        "id": "dustbin-count",
        "name": "Dustbins",
        "status": "good",
        "value": "42 units mapped",
        "severity": "low"
      },
      {
        "id": "light-pole-count",
        "name": "Light Poles",
        "status": "good",
        "value": "120 units mapped",
        "severity": "low"
      },
      {
        "id": "play-equipment",
        "name": "Play Equipment",
        "status": "good",
        "value": "15 units mapped",
        "severity": "low"
      },
      {
        "id": "irrigation-inventory",
        "name": "Irrigation Infra",
        "status": "good",
        "value": "3 pump stations, 12 valves",
        "severity": "low"
      },
      {
        "id": "pathway-length",
        "name": "Pathway Length",
        "status": "good",
        "value": "4.2 km total mapped",
        "severity": "low"
      }
    ]
  },
  {
    "id": "plantation-green-cover",
    "category": "Plants & Trees",
    "iconName": "Trees",
    "issueCount": 3,
    "status": "attention",
    "items": [
      {
        "id": "tree-count",
        "name": "Tree Count",
        "status": "good",
        "value": "1,247 trees mapped (32 new)",
        "severity": "low"
      },
      {
        "id": "tree-health",
        "name": "Tree Health",
        "status": "attention",
        "value": "91% Healthy, 6% Stressed, 3% Diseased",
        "severity": "medium"
      },
      {
        "id": "canopy-cover",
        "name": "Canopy Cover",
        "status": "good",
        "value": "68% coverage",
        "severity": "low"
      },
      {
        "id": "lawn-coverage",
        "name": "Lawn Coverage",
        "status": "attention",
        "value": "72% healthy, bare patches in Zone C",
        "severity": "medium"
      },
      {
        "id": "weed-infestation",
        "name": "Weed Infestation",
        "status": "issue",
        "value": "Moderate weed growth near pathways",
        "severity": "medium"
      },
      {
        "id": "shrub-coverage",
        "name": "Shrub Coverage",
        "status": "good",
        "value": "Adequate",
        "severity": "low"
      },
      {
        "id": "pruning-quality",
        "name": "Pruning Quality",
        "status": "attention",
        "value": "12 trees need pruning",
        "severity": "medium"
      },
      {
        "id": "hedge-trimming",
        "name": "Hedge Trimming",
        "status": "good",
        "value": "Well maintained",
        "severity": "low"
      },
      {
        "id": "flower-beds",
        "name": "Flower Beds",
        "status": "attention",
        "value": "3 beds need replanting",
        "severity": "medium"
      },
      {
        "id": "dead-vegetation",
        "name": "Dead Vegetation",
        "status": "good",
        "value": "Minimal",
        "severity": "low"
      }
    ]
  },
  {
    "id": "plant-health",
    "category": "Plant Health",
    "iconName": "Leaf",
    "issueCount": 2,
    "status": "attention",
    "items": [
      {
        "id": "health-index",
        "name": "Health Index (NDVI)",
        "status": "good",
        "value": "0.76 (Healthy range)",
        "severity": "low"
      },
      {
        "id": "leaf-discoloration",
        "name": "Leaf Discoloration",
        "status": "attention",
        "value": "Yellowing on 8 trees near lake",
        "severity": "medium"
      },
      {
        "id": "pest-disease",
        "name": "Pest/Disease",
        "status": "issue",
        "value": "Fungal spots on rose garden",
        "severity": "high"
      },
      {
        "id": "water-stress",
        "name": "Water Stress",
        "status": "good",
        "value": "No stress detected",
        "severity": "low"
      },
      {
        "id": "nutrient-levels",
        "name": "Nutrient Levels",
        "status": "good",
        "value": "Normal",
        "severity": "low"
      },
      {
        "id": "growth-progress",
        "name": "Growth Progress",
        "status": "good",
        "value": "+4% canopy density vs last month",
        "severity": "low"
      }
    ]
  },
  {
    "id": "irrigation",
    "category": "Irrigation Status",
    "iconName": "Droplets",
    "issueCount": 2,
    "status": "attention",
    "items": [
      {
        "id": "dry-zones",
        "name": "Dry Zones",
        "status": "issue",
        "value": "2 dry patches in east section",
        "severity": "high"
      },
      {
        "id": "waterlogging",
        "name": "Waterlogging",
        "status": "attention",
        "value": "Minor pooling near gate 3",
        "severity": "medium"
      },
      {
        "id": "leak-detection",
        "name": "Leak Detection",
        "status": "good",
        "value": "No leaks found",
        "severity": "low"
      },
      {
        "id": "moisture-levels",
        "name": "Moisture Levels",
        "status": "good",
        "value": "Even distribution",
        "severity": "low"
      }
    ]
  },
  {
    "id": "cleanliness",
    "category": "Cleanliness",
    "iconName": "Sparkles",
    "issueCount": 4,
    "status": "critical",
    "items": [
      {
        "id": "litter",
        "name": "Litter",
        "status": "issue",
        "value": "28 litter items detected",
        "severity": "high"
      },
      {
        "id": "bin-status",
        "name": "Bin Status",
        "status": "attention",
        "value": "3 bins overflowing (near food court)",
        "severity": "medium"
      },
      {
        "id": "debris",
        "name": "Debris",
        "status": "issue",
        "value": "Construction debris near north wall",
        "severity": "high"
      },
      {
        "id": "green-waste",
        "name": "Green Waste",
        "status": "attention",
        "value": "Leaf piles in 2 zones",
        "severity": "medium"
      },
      {
        "id": "water-stagnation",
        "name": "Water Stagnation",
        "status": "good",
        "value": "None detected",
        "severity": "low"
      }
    ]
  },
  {
    "id": "infrastructure",
    "category": "Infrastructure",
    "iconName": "Wrench",
    "issueCount": 3,
    "status": "attention",
    "items": [
      {
        "id": "pathways",
        "name": "Pathways",
        "status": "attention",
        "value": "Cracked tiles on main walkway",
        "severity": "medium"
      },
      {
        "id": "gates",
        "name": "Gates",
        "status": "good",
        "value": "All functional",
        "severity": "low"
      },
      {
        "id": "boundary-wall",
        "name": "Boundary Wall",
        "status": "issue",
        "value": "Damaged section — 12m stretch, east side",
        "severity": "high"
      },
      {
        "id": "railing",
        "name": "Railing",
        "status": "attention",
        "value": "Rusted sections near lake edge",
        "severity": "medium"
      },
      {
        "id": "benches",
        "name": "Benches",
        "status": "attention",
        "value": "4 benches need repair",
        "severity": "medium"
      },
      {
        "id": "play-equipment",
        "name": "Play Equipment",
        "status": "good",
        "value": "All safe",
        "severity": "low"
      },
      {
        "id": "gym-equipment",
        "name": "Gym Equipment",
        "status": "good",
        "value": "All functional",
        "severity": "low"
      },
      {
        "id": "signage",
        "name": "Signage",
        "status": "attention",
        "value": "2 signs faded",
        "severity": "low"
      },
      {
        "id": "light-poles",
        "name": "Light Poles",
        "status": "good",
        "value": "All working",
        "severity": "low"
      },
      {
        "id": "drinking-water",
        "name": "Drinking Water",
        "status": "good",
        "value": "3 points operational",
        "severity": "low"
      },
      {
        "id": "toilets",
        "name": "Toilets",
        "status": "good",
        "value": "Clean and functional",
        "severity": "low"
      },
      {
        "id": "parking",
        "name": "Parking",
        "status": "good",
        "value": "Clear",
        "severity": "low"
      },
      {
        "id": "gazebo",
        "name": "Gazebo/Pergola",
        "status": "good",
        "value": "Roof intact, clean",
        "severity": "low"
      },
      {
        "id": "excavations",
        "name": "Excavations",
        "status": "attention",
        "value": "Open trench near north gate",
        "severity": "medium"
      },
      {
        "id": "utility-damage",
        "name": "Utility Damage",
        "status": "good",
        "value": "None detected",
        "severity": "low"
      }
    ]
  },
  {
    "id": "safety-security",
    "category": "Safety & Security",
    "iconName": "ShieldCheck",
    "issueCount": 2,
    "status": "attention",
    "items": [
      {
        "id": "encroachment",
        "name": "Encroachment",
        "status": "issue",
        "value": "Temporary structure near south gate",
        "severity": "high"
      },
      {
        "id": "construction-activity",
        "name": "Construction Activity",
        "status": "good",
        "value": "None detected",
        "severity": "low"
      },
      {
        "id": "vehicles-inside",
        "name": "Vehicles Inside",
        "status": "attention",
        "value": "1 unauthorized vehicle (delivery van)",
        "severity": "medium"
      },
      {
        "id": "unsafe-trees",
        "name": "Unsafe Trees",
        "status": "good",
        "value": "None identified",
        "severity": "low"
      },
      {
        "id": "blind-spots",
        "name": "Blind Spots",
        "status": "good",
        "value": "All areas covered",
        "severity": "low"
      }
    ]
  },
  {
    "id": "water-bodies",
    "category": "Water Bodies",
    "iconName": "Waves",
    "issueCount": 2,
    "status": "attention",
    "items": [
      {
        "id": "water-level",
        "name": "Water Level",
        "status": "good",
        "value": "Normal",
        "severity": "low"
      },
      {
        "id": "algae-growth",
        "name": "Algae Growth",
        "status": "attention",
        "value": "Moderate in east pond",
        "severity": "medium"
      },
      {
        "id": "floating-waste",
        "name": "Floating Waste",
        "status": "issue",
        "value": "Plastic waste in lake — 6 items",
        "severity": "high"
      },
      {
        "id": "water-clarity",
        "name": "Water Clarity",
        "status": "good",
        "value": "Clear",
        "severity": "low"
      },
      {
        "id": "bank-erosion",
        "name": "Bank Erosion",
        "status": "good",
        "value": "Stable",
        "severity": "low"
      },
      {
        "id": "fountain",
        "name": "Fountain",
        "status": "good",
        "value": "Operational",
        "severity": "low"
      }
    ]
  },
  {
    "id": "landscape-quality",
    "category": "Landscape Quality",
    "iconName": "Palette",
    "issueCount": 1,
    "status": "attention",
    "items": [
      {
        "id": "symmetry",
        "name": "Symmetry",
        "status": "good",
        "value": "Well balanced",
        "severity": "low"
      },
      {
        "id": "colour-uniformity",
        "name": "Colour Uniformity",
        "status": "attention",
        "value": "Uneven flower colours in central bed",
        "severity": "medium"
      }
    ]
  }
];

export const mockParkInfo = {
  "parkName": "Sanjay Van",
  "location": "Vasant Kunj, New Delhi",
  "surveyDate": "2025-07-30",
  "surveyTime": "09:45 AM",
  "altitude": "85.2 m",
  "speed": "28.4 km/h",
  "heading": "124° SE",
  "battery": 74,
  "flightTime": "18:35",
  "gps": "28.5245° N, 77.1855° E",
  "signalStrength": 92,
  "areaCovered": "12.4 hectares",
  "totalArea": "317 hectares"
};

export const mockScores = [
  {
    "id": "overall-health",
    "label": "Overall Park Health",
    "score": 72,
    "icon": "Trees",
    "trend": "up",
    "changePercent": 3
  },
  {
    "id": "tree-survival",
    "label": "Tree Survival",
    "score": 92,
    "icon": "Leaf",
    "trend": "up",
    "changePercent": 1
  },
  {
    "id": "green-cover",
    "label": "Green Cover",
    "score": 68,
    "icon": "Leaf",
    "trend": "down",
    "changePercent": -2
  },
  {
    "id": "lawn-health",
    "label": "Grass Health",
    "score": 65,
    "icon": "Sprout",
    "trend": "down",
    "changePercent": -4
  },
  {
    "id": "cleanliness",
    "label": "Cleanliness",
    "score": 58,
    "icon": "Sparkles",
    "trend": "down",
    "changePercent": -7
  },
  {
    "id": "infrastructure",
    "label": "Infrastructure Condition",
    "score": 71,
    "icon": "Wrench",
    "trend": "stable",
    "changePercent": 0
  },
  {
    "id": "irrigation",
    "label": "Irrigation Efficiency",
    "score": 63,
    "icon": "Droplets",
    "trend": "down",
    "changePercent": -3
  },
  {
    "id": "safety",
    "label": "Safety",
    "score": 82,
    "icon": "Shield",
    "trend": "up",
    "changePercent": 5
  },
  {
    "id": "plantation-health",
    "label": "Plant Health",
    "score": 76,
    "icon": "TreePine",
    "trend": "up",
    "changePercent": 1
  },
  {
    "id": "encroachment-risk",
    "label": "Encroachment Risk",
    "score": 12,
    "icon": "AlertTriangle",
    "trend": "stable",
    "changePercent": 0
  },
  {
    "id": "citizen-readiness",
    "label": "Citizen Readiness",
    "score": 88,
    "icon": "Users",
    "trend": "up",
    "changePercent": 4
  },
  {
    "id": "maintenance-priority",
    "label": "Maintenance Priority",
    "score": 94,
    "icon": "Wrench",
    "trend": "up",
    "changePercent": 2
  },
  {
    "id": "layout-compliance",
    "label": "Layout Compliance",
    "score": 100,
    "icon": "Map",
    "trend": "stable",
    "changePercent": 0
  }
];
