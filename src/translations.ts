export type Language = 'en' | 'kn';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  dashboard: string;
  scanner: string;
  cabinet: string;
  reminders: string;
  history: string;
  settings: string;
  todayDate: string;
  nextScheduledDose: string;
  todayProgress: string;
  noUpcomingDoses: string;
  allDosesCompleted: string;
  markAsTaken: string;
  snooze: string;
  skipDose: string;
  viewDetails: string;
  pending: string;
  taken: string;
  skipped: string;
  missed: string;
  snoozed: string;
  active: string;
  paused: string;
  completed: string;
  tabletsPerDose: string;
  dosesPerDay: string;
  dailyTotal: string;
  dailyTotalDesc: string;
  scheduledTimes: string;
  startDate: string;
  endDate: string;
  mealTiming: string;
  beforeFood: string;
  afterFood: string;
  withFood: string;
  emptyStomach: string;
  bedtime: string;
  addReminder: string;
  editReminder: string;
  medicineName: string;
  searchMedicinePlaceholder: string;
  selectFromCabinet: string;
  scanPackaging: string;
  cameraCapture: string;
  uploadImage: string;
  capturePhoto: string;
  retakePhoto: string;
  identifyingMedicine: string;
  extractingOcr: string;
  verifiedMatch: string;
  unverifiedMatch: string;
  confidenceScore: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  verifiedPurpose: string;
  precautions: string;
  saveToCabinet: string;
  manualCorrection: string;
  saveChanges: string;
  cancel: string;
  delete: string;
  confirmDelete: string;
  currentStock: string;
  stockLowWarning: string;
  adherenceRate: string;
  weeklyAdherence: string;
  streakDays: string;
  soundPreference: string;
  vibrationPreference: string;
  testNotification: string;
  testSound: string;
  testAlertTitle: string;
  testAlertBody: string;
  browserNotifications: string;
  notificationPermissionGranted: string;
  notificationPermissionDenied: string;
  enableNotifications: string;
  voiceAssistance: string;
  listenKannada: string;
  listenEnglish: string;
  stopVoice: string;
  safetyDisclaimer: string;
  missedDoseWarning: string;
  duplicateScheduleWarning: string;
  conflictWarning: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: 'Mediscan',
    tagline: 'AI Medicine Identification, Kannada Voice & Daily Tablet Reminder',
    dashboard: 'Dashboard',
    scanner: 'Medicine Scanner',
    cabinet: 'My Medicines',
    reminders: 'Add Reminder',
    history: 'History & Adherence',
    settings: 'Settings',
    todayDate: "Today's Schedule",
    nextScheduledDose: 'Next Scheduled Dose',
    todayProgress: "Today's Completion",
    noUpcomingDoses: 'No more upcoming doses scheduled for today.',
    allDosesCompleted: 'Great job! All scheduled doses for today are completed.',
    markAsTaken: 'Mark as Taken',
    snooze: 'Snooze (10m)',
    skipDose: 'Skip Dose',
    viewDetails: 'View Details',
    pending: 'Pending',
    taken: 'Taken',
    skipped: 'Skipped',
    missed: 'Missed',
    snoozed: 'Snoozed',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    tabletsPerDose: 'Tablets Per Dose',
    dosesPerDay: 'Doses Per Day (Frequency)',
    dailyTotal: 'Calculated Daily Total',
    dailyTotalDesc: 'Illustrative schedule based on prescription input, not a clinical recommendation.',
    scheduledTimes: 'Scheduled Dose Times',
    startDate: 'Start Date',
    endDate: 'End Date (Optional)',
    mealTiming: 'Meal Instructions',
    beforeFood: 'Before food',
    afterFood: 'After food',
    withFood: 'With food',
    emptyStomach: 'Empty stomach (Morning)',
    bedtime: 'At bedtime',
    addReminder: 'Set New Medicine Reminder',
    editReminder: 'Edit Reminder Schedule',
    medicineName: 'Medicine Name',
    searchMedicinePlaceholder: 'Search verified medicine or brand...',
    selectFromCabinet: 'Select from My Medicine Cabinet',
    scanPackaging: 'Scan Packaging with Camera / Upload',
    cameraCapture: 'Live Camera Capture',
    uploadImage: 'Upload Medicine Box / Strip Photo',
    capturePhoto: 'Take Picture',
    retakePhoto: 'Retake Photo',
    identifyingMedicine: 'Analyzing packaging with AI OCR...',
    extractingOcr: 'Reading active ingredients and strength...',
    verifiedMatch: 'Verified Pharmacopoeia Record',
    unverifiedMatch: 'AI Detected Suggestion (Manual verification required)',
    confidenceScore: 'AI Match Confidence',
    activeIngredient: 'Active Ingredient (Salt)',
    strength: 'Strength',
    dosageForm: 'Dosage Form',
    manufacturer: 'Manufacturer',
    verifiedPurpose: 'Verified Purpose & Indications',
    precautions: 'Important Precautions',
    saveToCabinet: 'Add to My Cabinet',
    manualCorrection: 'Edit / Correct OCR Detection',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to remove this item?',
    currentStock: 'Current Stock (Tablets/Units)',
    stockLowWarning: 'Low stock alert! Please refill soon.',
    adherenceRate: 'Adherence Rate',
    weeklyAdherence: '7-Day Adherence Overview',
    streakDays: 'Day Perfect Streak',
    soundPreference: 'Reminder Alert Sound',
    vibrationPreference: 'Vibration Haptic Alert',
    testNotification: 'Test Live Notification',
    testSound: 'Play Audio Chime',
    testAlertTitle: 'Mediscan Reminder Test',
    testAlertBody: 'Audible chime and vibration test successful.',
    browserNotifications: 'Browser Desktop & Mobile Notifications',
    notificationPermissionGranted: 'Notifications are Active & Permitted',
    notificationPermissionDenied: 'Notifications are Blocked. Please allow notifications in site settings.',
    enableNotifications: 'Enable Notifications',
    voiceAssistance: 'Voice Guidance (Text-to-Speech)',
    listenKannada: 'Listen in Kannada (ಕನ್ನಡ)',
    listenEnglish: 'Listen in English',
    stopVoice: 'Stop Voice',
    safetyDisclaimer: 'Mediscan is an identification aid and reminder tool, not a substitute for professional medical advice or clinical diagnosis. Never alter your dosage without consulting a healthcare professional.',
    missedDoseWarning: 'If you missed a dose, do not double up on your next dose. Follow standard prescription directions or contact your doctor/pharmacist.',
    duplicateScheduleWarning: 'Warning: Another active reminder already exists for this medicine. Please verify your regimen.',
    conflictWarning: 'Time Conflict: Another medication is scheduled at the same time. Ensure adequate water intake and follow food instructions.',
  },
  kn: {
    appName: 'ಮೆಡಿಸ್ಕ್ಯಾನ್ (Mediscan)',
    tagline: 'ಎಐ ಔಷಧಿ ಗುರುತಿಸುವಿಕೆ, ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯ ಮತ್ತು ಮಾತ್ರೆಗಳ ನೆನಪಿಸುವಿಕೆ',
    dashboard: 'ಮುಖಪುಟ (ಡ್ಯಾಶ್‌ಬೋರ್ಡ್)',
    scanner: 'ಔಷಧಿ ಸ್ಕ್ಯಾನರ್',
    cabinet: 'ನನ್ನ ಔಷಧಿಗಳು',
    reminders: 'ಜ್ಞಾಪನೆ ಸೇರಿಸಿ',
    history: 'ಇತಿಹಾಸ ಮತ್ತು ವರದಿ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    todayDate: 'ಇಂದಿನ ವೇಳಾಪಟ್ಟಿ',
    nextScheduledDose: 'ಮುಂದಿನ ನಿಗದಿತ ಮಾತ್ರೆ',
    todayProgress: 'ಇಂದಿನ ಪ್ರಗತಿ',
    noUpcomingDoses: 'ಇಂದಿಗೆ ಯಾವುದೇ ಬಾಕಿ ಮಾತ್ರೆಗಳಿಲ್ಲ.',
    allDosesCompleted: 'ಅಭಿನಂದನೆಗಳು! ಇಂದಿನ ಎಲ್ಲಾ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ.',
    markAsTaken: 'ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ',
    snooze: 'ಮುಂದೂಡು (೧೦ ನಿಮಿಷ)',
    skipDose: 'ಬಿಟ್ಟುಬಿಡಿ',
    viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    pending: 'ಬಾಕಿ ಇದೆ',
    taken: 'ತೆಗೆದುಕೊಂಡಿದೆ',
    skipped: 'ಬಿಟ್ಟುಬಿಟ್ಟಿದೆ',
    missed: 'ತಪ್ಪಿಹೋಗಿದೆ',
    snoozed: 'ಮುಂದೂಡಲಾಗಿದೆ',
    active: 'ಸಕ್ರಿಯ',
    paused: 'ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    tabletsPerDose: 'ಪ್ರತಿ ಬಾರಿಗೆ ಎಷ್ಟು ಮಾತ್ರೆ?',
    dosesPerDay: 'ದಿನಕ್ಕೆ ಎಷ್ಟು ಬಾರಿ?',
    dailyTotal: 'ದಿನದ ಒಟ್ಟು ಮಾತ್ರೆಗಳು',
    dailyTotalDesc: 'ಇದು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಆಧಾರಿತ ಲೆಕ್ಕಾಚಾರ, ವೈದ್ಯಕೀಯ ಶಿಫಾರಸಲ್ಲ.',
    scheduledTimes: 'ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ',
    startDate: 'ಪ್ರಾರಂಭ ದಿನಾಂಕ',
    endDate: 'ಮುಕ್ತಾಯ ದಿನಾಂಕ (ಐಚ್ಛಿಕ)',
    mealTiming: 'ಆಹಾರದ ಸಮಯದ ಸೂಚನೆ',
    beforeFood: 'ಊಟಕ್ಕೆ ಮುಂಚೆ',
    afterFood: 'ಊಟದ ನಂತರ',
    withFood: 'ಊಟದೊಂದಿಗೆ',
    emptyStomach: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ (ಬೆಳಗ್ಗೆ)',
    bedtime: 'ರಾತ್ರಿ ಮಲಗುವ ಮುನ್ನ',
    addReminder: 'ಹೊಸ ಔಷಧಿ ಜ್ಞಾಪನೆ ಹೊಂದಿಸಿ',
    editReminder: 'ವೇಳಾಪಟ್ಟಿ ತಿದ್ದುಪಡಿ',
    medicineName: 'ಔಷಧಿಯ ಹೆಸರು',
    searchMedicinePlaceholder: 'ಔಷಧಿ ಅಥವಾ ಬ್ರ್ಯಾಂಡ್ ಹುಡುಕಿ...',
    selectFromCabinet: 'ನನ್ನ ಕ್ಯಾಬಿನೆಟ್‌ನಿಂದ ಆಯ್ಕೆ ಮಾಡಿ',
    scanPackaging: 'ಕ್ಯಾಮೆರಾ / ಫೋಟೋ ಮೂಲಕ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    cameraCapture: 'ಲೈವ್ ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್',
    uploadImage: 'ಔಷಧಿ ಬಾಕ್ಸ್ ಅಥವಾ ಸ್ಟ್ರಿಪ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    capturePhoto: 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
    retakePhoto: 'ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ',
    identifyingMedicine: 'ಎಐ ಮೂಲಕ ಔಷಧಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    extractingOcr: 'ಹೆಸರು, ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಅಂಶಗಳನ್ನು ಓದಲಾಗುತ್ತಿದೆ...',
    verifiedMatch: 'ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಔಷಧ ದಾಖಲೆ',
    unverifiedMatch: 'ಎಐ ಸಲಹೆ (ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ)',
    confidenceScore: 'ಎಐ ಹೊಂದಾಣಿಕೆ ನಿಖರತೆ',
    activeIngredient: 'ಸಕ್ರಿಯ ಅಂಶ (ಸಾಲ್ಟ್)',
    strength: 'ಸಾಮರ್ಥ್ಯ (Strength)',
    dosageForm: 'ರೂಪ (ಮಾತ್ರೆ / ಸಿರಪ್)',
    manufacturer: 'ತಯಾರಕರು',
    verifiedPurpose: 'ಬಳಕೆ ಮತ್ತು ಪ್ರಯೋಜನಗಳು',
    precautions: 'ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು',
    saveToCabinet: 'ನನ್ನ ಕ್ಯಾಬಿನೆಟ್‌ಗೆ ಉಳಿಸಿ',
    manualCorrection: 'ಮಾಹಿತಿಯನ್ನು ತಿದ್ದಿ / ಸರಿಪಡಿಸಿ',
    saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    delete: 'ಅಳಿಸಿ',
    confirmDelete: 'ಖಂಡಿತವಾಗಿಯೂ ಈ ಔಷಧಿಯನ್ನು ತೆಗೆದುಹಾಕಬೇಕೆ?',
    currentStock: 'ಉಳಿದಿರುವ ಮಾತ್ರೆಗಳ ಸಂಖ್ಯೆ',
    stockLowWarning: 'ಮಾತ್ರೆಗಳು ಮುಗಿಯುತ್ತಿವೆ! ದಯವಿಟ್ಟು ಖರೀದಿಸಿ.',
    adherenceRate: 'ನಿಯಮಿತತೆಯ ಪ್ರಮಾಣ',
    weeklyAdherence: 'ವಾರದ ಪಾಲನೆ ವಿವರ',
    streakDays: 'ದಿನಗಳ ಸತತ ಪಾಲನೆ',
    soundPreference: 'ಅಲಾರಂ ರಿಂಗ್‌ಟೋನ್',
    vibrationPreference: 'ವೈಬ್ರೇಶನ್ ಕಂಪನ',
    testNotification: 'ಪರೀಕ್ಷಾರ್ಥ ನೋಟಿಫಿಕೇಶನ್',
    testSound: 'ಶಬ್ದವನ್ನು ಪರೀಕ್ಷಿಸಿ',
    testAlertTitle: 'ಮೆಡಿಸ್ಕ್ಯಾನ್ ಜ್ಞಾಪನೆ ಪರೀಕ್ಷೆ',
    testAlertBody: 'ಅಲಾರಂ ಮತ್ತು ಕಂಪನ ಸರಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ.',
    browserNotifications: 'ಬ್ರೌಸರ್ ನೋಟಿಫಿಕೇಶನ್ ಅನುಮತಿ',
    notificationPermissionGranted: 'ನೋಟಿಫಿಕೇಶನ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ',
    notificationPermissionDenied: 'ನೋಟಿಫಿಕೇಶನ್‌ಗಳನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.',
    enableNotifications: 'ನೋಟಿಫಿಕೇಶನ್ ಆನ್ ಮಾಡಿ',
    voiceAssistance: 'ಧ್ವನಿ ಸಹಾಯ (ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ)',
    listenKannada: 'ಕನ್ನಡದಲ್ಲಿ ಆಲಿಸಿ',
    listenEnglish: 'ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಆಲಿಸಿ',
    stopVoice: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ',
    safetyDisclaimer: 'ಮೆಡಿಸ್ಕ್ಯಾನ್ ಕೇವಲ ನೆನಪಿಸುವ ಮತ್ತು ಗುರುತಿಸುವ ಸಾಧನವಾಗಿದೆ, ಇದು ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಬದಲಿಯಾಗಿಲ್ಲ. ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸದೆ ಔಷಧಿ ಪ್ರಮಾಣವನ್ನು ಬದಲಾಯಿಸಬೇಡಿ.',
    missedDoseWarning: 'ಒಂದು ವೇಳೆ ಡೋಸ್ ತಪ್ಪಿಹೋಗಿದ್ದರೆ, ಮುಂದಿನ ಬಾರಿ ಎರಡು ಮಾತ್ರೆಗಳನ್ನು ಒಟ್ಟಿಗೆ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ. ನಿಮ್ಮ ವೈದ್ಯರ ಸಲಹೆ ಪಡೆಯಿರಿ.',
    duplicateScheduleWarning: 'ಎಚ್ಚರಿಕೆ: ಈ ಔಷಧಿಗೆ ಈಗಾಗಲೇ ಸಕ್ರಿಯ ಜ್ಞಾಪನೆ ಅಸ್ತಿತ್ವದಲ್ಲಿದೆ.',
    conflictWarning: 'ಸಮಯದ ಘರ್ಷಣೆ: ಇದೇ ಸಮಯದಲ್ಲಿ ಮತ್ತೊಂದು ಮಾತ್ರೆ ನಿಗದಿಯಾಗಿದೆ.',
  },
};
