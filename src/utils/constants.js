export const ISSUE_CATEGORIES = [
  'Road Damage / Pothole',
  'Pavement / Sidewalk Damage',
  'Traffic Signal Issues',
  'Road Markings & Speed Breakers',
  'Traffic Obstruction',
  'Trash / Illegal Dumping',
  'Water Leak / Drainage',
  'Sewage / Sanitation',
  'Public Toilets',
  'Dead Animals',
  'Pest Infestation',
  'Open Manholes',
  'Water Supply Issues',
  'Flooding / Waterlogging',
  'Streetlight Issues',
  'Power Outage',
  'Exposed Wires',
  'Transformer Issues',
  'Illegal Banners',
  'Encroachments',
  'Unauthorized Construction',
  'Illegal Dumping',
  'Other',
];

export const CATEGORY_TO_DEPARTMENT = {
  'Road Damage / Pothole': 'Road Maintenance Department',
  'Pavement / Sidewalk Damage': 'Public Works Department',
  'Traffic Signal Issues': 'Traffic Operations Department',
  'Road Markings & Speed Breakers': 'Road Maintenance Department',
  'Traffic Obstruction': 'Traffic Operations Department',
  'Trash / Illegal Dumping': 'Solid Waste Management Department',
  'Water Leak / Drainage': 'Water and Drainage Department',
  'Sewage / Sanitation': 'Sanitation Department',
  'Public Toilets': 'Sanitation Department',
  'Dead Animals': 'Sanitation Department',
  'Pest Infestation': 'Sanitation Department',
  'Open Manholes': 'Sanitation Department',
  'Water Supply Issues': 'Water and Drainage Department',
  'Flooding / Waterlogging': 'Water and Drainage Department',
  'Streetlight Issues': 'Electrical Maintenance Department',
  'Power Outage': 'Electrical Maintenance Department',
  'Exposed Wires': 'Electrical Maintenance Department',
  'Transformer Issues': 'Electrical Maintenance Department',
  'Illegal Banners': 'Civic Maintenance Department',
  'Encroachments': 'Civic Maintenance Department',
  'Unauthorized Construction': 'Building Compliance Department',
  'Illegal Dumping': 'Solid Waste Management Department',
  Other: 'Ward Civic Support Department',
};

export const AI_CATEGORY_MAP = {
  'Roads & Infrastructure': ['Roads & Potholes', 'Footpaths & Sidewalks', 'Traffic Signals & Signs', 'Road Markings & Speed Breakers', 'Traffic Obstruction'],
  'Sanitation & Public Health': ['Garbage & Waste', 'Drainage & Sewage', 'Public Toilets', 'Dead Animals', 'Pest Infestation', 'Open Manholes / Safety Hazards'],
  'Water & Utilities': ['Water Supply Issues', 'Water Leakage / Pipeline Damage', 'Flooding / Waterlogging'],
  'Electrical Issues': ['Power Outage', 'Streetlight Not Working', 'Exposed / Hanging Wires', 'Transformer Issues'],
  'Illegal Activities & Violations': ['Illegal Banners / Hoardings', 'Encroachments', 'Unauthorized Construction', 'Illegal Dumping'],
};

export const AI_CATEGORY_TO_CIVIX_CATEGORY = {
  'Roads & Infrastructure::Roads & Potholes': 'Road Damage / Pothole',
  'Roads & Infrastructure::Footpaths & Sidewalks': 'Pavement / Sidewalk Damage',
  'Roads & Infrastructure::Traffic Signals & Signs': 'Traffic Signal Issues',
  'Roads & Infrastructure::Road Markings & Speed Breakers': 'Road Markings & Speed Breakers',
  'Roads & Infrastructure::Traffic Obstruction': 'Traffic Obstruction',
  'Sanitation & Public Health::Garbage & Waste': 'Trash / Illegal Dumping',
  'Sanitation & Public Health::Drainage & Sewage': 'Water Leak / Drainage',
  'Sanitation & Public Health::Public Toilets': 'Public Toilets',
  'Sanitation & Public Health::Dead Animals': 'Dead Animals',
  'Sanitation & Public Health::Pest Infestation': 'Pest Infestation',
  'Sanitation & Public Health::Open Manholes / Safety Hazards': 'Open Manholes',
  'Water & Utilities::Water Supply Issues': 'Water Supply Issues',
  'Water & Utilities::Water Leakage / Pipeline Damage': 'Water Leak / Drainage',
  'Water & Utilities::Flooding / Waterlogging': 'Flooding / Waterlogging',
  'Electrical Issues::Power Outage': 'Power Outage',
  'Electrical Issues::Streetlight Not Working': 'Streetlight Issues',
  'Electrical Issues::Exposed / Hanging Wires': 'Exposed Wires',
  'Electrical Issues::Transformer Issues': 'Transformer Issues',
  'Illegal Activities & Violations::Illegal Banners / Hoardings': 'Illegal Banners',
  'Illegal Activities & Violations::Encroachments': 'Encroachments',
  'Illegal Activities & Violations::Unauthorized Construction': 'Unauthorized Construction',
  'Illegal Activities & Violations::Illegal Dumping': 'Illegal Dumping',
};

export const REPORT_SOURCES = {
  APP: 'app',
  WHATSAPP: 'whatsapp',
};

export const ISSUE_STATUS = {
  OPEN: 'open',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  IN_PROGRESS_ALIAS: 'in progress',
  REVIEW: 'review',
  RESOLVED: 'resolved',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
};

const STATUS_NORMALIZATION_MAP = {
  [ISSUE_STATUS.OPEN]: ISSUE_STATUS.OPEN,
  [ISSUE_STATUS.PENDING]: ISSUE_STATUS.PENDING,
  [ISSUE_STATUS.IN_PROGRESS]: ISSUE_STATUS.IN_PROGRESS,
  [ISSUE_STATUS.IN_PROGRESS_ALIAS]: ISSUE_STATUS.IN_PROGRESS,
  [ISSUE_STATUS.REVIEW]: ISSUE_STATUS.REVIEW,
  [ISSUE_STATUS.RESOLVED]: ISSUE_STATUS.RESOLVED,
  [ISSUE_STATUS.COMPLETED]: ISSUE_STATUS.COMPLETED,
  [ISSUE_STATUS.VERIFIED]: ISSUE_STATUS.VERIFIED,
};

export const PENDING_ISSUE_STATUSES = [ISSUE_STATUS.PENDING, ISSUE_STATUS.OPEN];
export const ACTIVE_ISSUE_STATUSES = [
  ISSUE_STATUS.IN_PROGRESS,
  ISSUE_STATUS.IN_PROGRESS_ALIAS,
  ISSUE_STATUS.REVIEW,
];
export const RESOLVED_ISSUE_STATUSES = [
  ISSUE_STATUS.RESOLVED,
  ISSUE_STATUS.COMPLETED,
  ISSUE_STATUS.VERIFIED,
];

export function normalizeIssueStatus(status) {
  const normalized = String(status || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return STATUS_NORMALIZATION_MAP[normalized] || normalized;
}

export function statusEquals(status, expectedStatus) {
  return normalizeIssueStatus(status) === normalizeIssueStatus(expectedStatus);
}

export function isPendingStatus(status) {
  return PENDING_ISSUE_STATUSES.includes(normalizeIssueStatus(status));
}

export function isInProgressStatus(status) {
  const normalized = normalizeIssueStatus(status);
  return ACTIVE_ISSUE_STATUSES.some((candidate) => normalizeIssueStatus(candidate) === normalized);
}

export function isResolvedStatus(status) {
  const normalized = normalizeIssueStatus(status);
  return RESOLVED_ISSUE_STATUSES.some((candidate) => normalizeIssueStatus(candidate) === normalized);
}

export function getDepartmentForCategory(category) {
  return CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.Other;
}

export function getSubcategoriesForAiCategory(category) {
  return AI_CATEGORY_MAP[category] || [];
}

export function getCivixCategoryFromAiClassification(category, subcategory) {
  return AI_CATEGORY_TO_CIVIX_CATEGORY[`${category}::${subcategory}`] || 'Other';
}
