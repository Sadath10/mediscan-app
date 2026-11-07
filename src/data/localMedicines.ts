export interface LocalMedicine {
  id: string;
  brandName: string;
  genericName: string;
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Suspension' | 'Drops';
  strength: string;
  usage: string;
  dosage: string;
  foodInstructions: string;
  foodTiming: 'before_food' | 'after_food' | 'with_food' | 'empty_stomach' | 'general';
  sideEffects: {
    common: string[];
    seekMedicalHelp: string[];
  };
  manufacturer: string;
  kannada?: {
    brandName?: string;
    genericName?: string;
    usage?: string;
    dosage?: string;
    foodInstructions?: string;
  };
}

export const LOCAL_MEDICINES: LocalMedicine[] = [
  // ==========================================
  // TABLETS
  // ==========================================
  {
    id: 'med-dolo-650',
    brandName: 'Dolo-650',
    genericName: 'Paracetamol',
    form: 'Tablet',
    strength: '650 mg',
    usage: 'Analgesic and antipyretic for mild-to-moderate fever, headache, and body aches.',
    dosage: '1 tablet every 4 to 6 hours as needed. Do not exceed 4 tablets in 24 hours.',
    foodInstructions: 'Take with or after food with a full glass of water.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Nausea', 'Mild stomach discomfort', 'Drowsiness'],
      seekMedicalHelp: ['Swelling of face/lips', 'Yellowing of skin or eyes (liver indicator)', 'Severe skin rash'],
    },
    manufacturer: 'Micro Labs Limited',
    kannada: {
      usage: 'ಜ್ವರ ಮತ್ತು ಮೈಕೈ ನೋವು ಕಡಿಮೆ ಮಾಡಲು ಬಳಸುವ ಔಷಧಿ.',
      dosage: '೧ ಮಾತ್ರೆ ೪ ರಿಂದ ೬ ಗಂಟೆಗಳ ಅಂತರದಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಿ. ದಿನಕ್ಕೆ ೪ಕ್ಕಿಂತ ಹೆಚ್ಚು ಬೇಡ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಒಂದು ಲೋಟ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-crocin-advance',
    brandName: 'Crocin Advance',
    genericName: 'Paracetamol',
    form: 'Tablet',
    strength: '500 mg',
    usage: 'Fast-release antipyretic and analgesic for fever, toothache, and body pain.',
    dosage: '1 to 2 tablets every 4 to 6 hours. Maximum 4000 mg in 24 hours.',
    foodInstructions: 'Take after food with water.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Nausea', 'Mild dizziness'],
      seekMedicalHelp: ['Difficulty breathing', 'Facial swelling', 'Severe allergic rash'],
    },
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    kannada: {
      usage: 'ಜ್ವರ ಮತ್ತು ತಲೆನೋವಿಗೆ ಬಳಸುವ ಪ್ಯಾರಸಿಟಮಾಲ್ ಮಾತ್ರೆ.',
      dosage: '೧ ಅಥವಾ ೨ ಮಾತ್ರೆ ೪ ರಿಂದ ೬ ಗಂಟೆಗಳಿಗೊಮ್ಮೆ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-calpol-650',
    brandName: 'Calpol 650',
    genericName: 'Paracetamol',
    form: 'Tablet',
    strength: '650 mg',
    usage: 'Treatment of fever and moderate pain associated with headache, migraine, and colds.',
    dosage: '1 tablet 3 to 4 times a day with minimum 4 hours gap.',
    foodInstructions: 'Take with or after meals to avoid stomach irritation.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Mild nausea', 'Headache'],
      seekMedicalHelp: ['Severe skin hives', 'Liver distress'],
    },
    manufacturer: 'GSK Consumer Healthcare',
  },
  {
    id: 'med-augmentin-625',
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin and Clavulanate Potassium',
    form: 'Tablet',
    strength: '625 mg (500mg/125mg)',
    usage: 'Broad-spectrum antibiotic for bacterial ENT, respiratory, skin, and dental infections.',
    dosage: '1 tablet twice daily (every 12 hours) for prescribed duration (typically 5-7 days).',
    foodInstructions: 'Take at the start of a meal to prevent gastrointestinal discomfort.',
    foodTiming: 'with_food',
    sideEffects: {
      common: ['Diarrhea', 'Nausea', 'Vomiting', 'Mild abdominal cramps'],
      seekMedicalHelp: ['Severe watery diarrhea', 'Anaphylactic allergy', 'Yellowing of skin/eyes'],
    },
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    kannada: {
      usage: 'ಉಸಿರಾಟ ಮತ್ತು ಗಂಟಲು ಸೋಂಕು ನಿವಾರಕ ಪ್ರತಿಜೀವಕ (ಆಂಟಿಬಯೋಟಿಕ್).',
      dosage: 'ದಿನಕ್ಕೆ ೨ ಬಾರಿ (ಪ್ರತಿ ೧೨ ಗಂಟೆಗೆ) ಊಟದ ಪ್ರಾರಂಭದಲ್ಲಿ ಸೇವಿಸಿ.',
      foodInstructions: 'ಹೊಟ್ಟೆಯುಬ್ಬರ ತಪ್ಪಿಸಲು ಊಟದ ಆರಂಭದಲ್ಲಿ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-clavam-625',
    brandName: 'Clavam 625',
    genericName: 'Amoxicillin and Clavulanate Potassium',
    form: 'Tablet',
    strength: '625 mg',
    usage: 'Penicillin-class antibiotic for resistant bacterial infections.',
    dosage: '1 tablet twice daily with meals for complete prescribed duration.',
    foodInstructions: 'Take immediately with meals.',
    foodTiming: 'with_food',
    sideEffects: {
      common: ['Nausea', 'Loose stools', 'Oral thrush'],
      seekMedicalHelp: ['Severe persistent diarrhea', 'Shortness of breath'],
    },
    manufacturer: 'Alkem Laboratories Ltd',
  },
  {
    id: 'med-pan-40',
    brandName: 'Pan-40',
    genericName: 'Pantoprazole',
    form: 'Tablet',
    strength: '40 mg',
    usage: 'Proton pump inhibitor (PPI) for gastric acidity, GERD, and peptic ulcer healing.',
    dosage: '1 tablet once daily in the morning, 30 to 60 minutes before breakfast.',
    foodInstructions: 'Take on an empty stomach 30-60 minutes before food with water. Swallow whole.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Headache', 'Mild diarrhea', 'Flatulence', 'Dry mouth'],
      seekMedicalHelp: ['Severe joint or muscle pain', 'Persistent diarrhea', 'Hypomagnesemia spasms'],
    },
    manufacturer: 'Alkem Laboratories Ltd',
    kannada: {
      usage: 'ಗ್ಯಾಸ್ಟ್ರಿಕ್, ಎದೆಉರಿ ಮತ್ತು ಅಸಿಡಿಟಿ ನಿವಾರಕ ಮಾತ್ರೆ.',
      dosage: 'ಬೆಳಿಗ್ಗೆ ಉಪಹಾರಕ್ಕಿಂತ ೩೦ ನಿಮಿಷ ಮೊದಲು ೧ ಮಾತ್ರೆ.',
      foodInstructions: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸೇವಿಸಿ. ಮಾತ್ರೆ ಪುಡಿಮಾಡಬೇಡಿ.',
    },
  },
  {
    id: 'med-pantocid-40',
    brandName: 'Pantocid 40',
    genericName: 'Pantoprazole Sodium',
    form: 'Tablet',
    strength: '40 mg',
    usage: 'Acid reflux reduction and esophageal erosion healing.',
    dosage: '1 tablet daily before breakfast for 4 to 8 weeks as prescribed.',
    foodInstructions: 'Take 30 minutes before first meal of the day.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Nausea', 'Abdominal pain', 'Constipation'],
      seekMedicalHelp: ['Severe allergic reaction', 'Bone fracture risk on prolonged usage'],
    },
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
  },
  {
    id: 'med-glycomet-500',
    brandName: 'Glycomet 500',
    genericName: 'Metformin Hydrochloride',
    form: 'Tablet',
    strength: '500 mg',
    usage: 'First-line biguanide oral antidiabetic for blood glucose control in Type 2 Diabetes.',
    dosage: '1 tablet once or twice daily with or immediately after meals.',
    foodInstructions: 'Always take with food or meals to minimize gastric distress.',
    foodTiming: 'with_food',
    sideEffects: {
      common: ['Nausea', 'Metallic taste in mouth', 'Bloating', 'Stomach ache'],
      seekMedicalHelp: ['Lactic acidosis (muscle cramping, severe fatigue)', 'Persistent vomiting'],
    },
    manufacturer: 'USV Private Limited',
    kannada: {
      usage: 'ಟೈಪ್ ೨ ಮಧುಮೇಹ (ಸಕ್ಕರೆ ಕಾಯಿಲೆ) ನಿಯಂತ್ರಣಕ್ಕೆ ಬಳಸುವ ಔಷಧಿ.',
      dosage: 'ಊಟದೊಂದಿಗೆ ೧ ಮಾತ್ರೆ ದಿನಕ್ಕೆ ೧ ಅಥವಾ ೨ ಬಾರಿ.',
      foodInstructions: 'ಹೊಟ್ಟೆಯ ತೊಂದರೆ ತಪ್ಪಿಸಲು ಊಟದ ಜೊತೆಗೆ ಅಥವಾ ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ.',
    },
  },
  {
    id: 'med-azee-500',
    brandName: 'Azee 500',
    genericName: 'Azithromycin',
    form: 'Tablet',
    strength: '500 mg',
    usage: 'Used to treat bacterial infections.',
    dosage: '500 mg',
    foodInstructions: 'Take with or without food.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Nausea', 'Diarrhea', 'Mild abdominal discomfort', 'Headache'],
      seekMedicalHelp: ['Heart palpitations / QT prolongation', 'Severe abdominal cramps'],
    },
    manufacturer: 'Cipla Limited',
    kannada: {
      usage: 'ಬ್ಯಾಕ್ಟೀರಿಯಾದ ಸೋಂಕು ನಿವಾರಕ ಆಂಟಿಬಯೋಟಿಕ್.',
      dosage: '೫೦೦ ಮಿ.ಗ್ರಾಂ (ದಿನಕ್ಕೆ ೧ ಮಾತ್ರೆ).',
      foodInstructions: 'ಊಟದೊಂದಿಗೆ ಅಥವಾ ಊಟವಿಲ್ಲದೆ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-azithral-500',
    brandName: 'Azithral 500',
    genericName: 'Azithromycin',
    form: 'Tablet',
    strength: '500 mg',
    usage: 'Used to treat bacterial infections.',
    dosage: '500 mg',
    foodInstructions: 'Take with or without food.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Nausea', 'Diarrhea', 'Abdominal discomfort', 'Mild headache'],
      seekMedicalHelp: ['Irregular heart rhythm', 'Jaundice'],
    },
    manufacturer: 'Alembic Pharmaceuticals Ltd',
    kannada: {
      usage: 'ಬ್ಯಾಕ್ಟೀರಿಯಾದ ಸೋಂಕು ನಿವಾರಕ ಆಂಟಿಬಯೋಟಿಕ್.',
      dosage: '೫೦೦ ಮಿ.ಗ್ರಾಂ (ದಿನಕ್ಕೆ ೧ ಮಾತ್ರೆ).',
      foodInstructions: 'ಊಟದೊಂದಿಗೆ ಅಥವಾ ಊಟವಿಲ್ಲದೆ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-cetzine-10',
    brandName: 'Cetzine 10',
    genericName: 'Cetirizine Hydrochloride',
    form: 'Tablet',
    strength: '10 mg',
    usage: 'Antihistamine for seasonal allergic rhinitis, runny nose, sneezing, and hives.',
    dosage: '1 tablet once daily in the evening or at bedtime.',
    foodInstructions: 'Take with or without food with water. Avoid alcohol.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Mild drowsiness', 'Dry mouth', 'Fatigue', 'Headache'],
      seekMedicalHelp: ['Difficulty urinating', 'Severe breathing difficulty'],
    },
    manufacturer: 'Dr. Reddy\'s Laboratories Ltd',
  },
  {
    id: 'med-allegra-120',
    brandName: 'Allegra 120',
    genericName: 'Fexofenadine Hydrochloride',
    form: 'Tablet',
    strength: '120 mg',
    usage: 'Non-drowsy antihistamine for hay fever, allergic rhinitis, and itchy skin rashes.',
    dosage: '1 tablet once daily with water. Do not take with fruit juices.',
    foodInstructions: 'Take before food with water. Avoid taking with fruit juices (grapefruit/apple/orange).',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Headache', 'Drowsiness (rare)', 'Nausea'],
      seekMedicalHelp: ['Swelling of face', 'Chest tightness'],
    },
    manufacturer: 'Sanofi India Ltd',
  },
  {
    id: 'med-brufen-400',
    brandName: 'Brufen 400',
    genericName: 'Ibuprofen',
    form: 'Tablet',
    strength: '400 mg',
    usage: 'NSAID anti-inflammatory analgesic for joint pain, arthritis, dental pain, and sprains.',
    dosage: '1 tablet 2 to 3 times daily after food. Maximum 1200 mg per day OTC.',
    foodInstructions: 'Always take with food or milk to protect stomach lining.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Indigestion', 'Heartburn', 'Nausea', 'Stomach pain'],
      seekMedicalHelp: ['Black tarry stools (gastric bleeding)', 'Severe chest pain', 'Swelling of ankles'],
    },
    manufacturer: 'Abbott Healthcare Pvt Ltd',
  },
  {
    id: 'med-combiflam',
    brandName: 'Combiflam',
    genericName: 'Ibuprofen (400mg) + Paracetamol (325mg)',
    form: 'Tablet',
    strength: '400mg/325mg',
    usage: 'Dual-action analgesic NSAID for severe toothache, headache, musculoskeletal and muscular pain.',
    dosage: '1 tablet 2 to 3 times daily after food as needed.',
    foodInstructions: 'Strictly take after food with plenty of water.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Gastric irritation', 'Nausea', 'Heartburn'],
      seekMedicalHelp: ['Gastric ulceration', 'Kidney strain on prolonged use'],
    },
    manufacturer: 'Sanofi India Ltd',
  },
  {
    id: 'med-zerodol-sp',
    brandName: 'Zerodol-SP',
    genericName: 'Aceclofenac, Paracetamol & Serratiopeptidase',
    form: 'Tablet',
    strength: '100mg/325mg/15mg',
    usage: 'Triple-combination anti-inflammatory and pain relief for joint inflammation, swelling, and surgical recovery.',
    dosage: '1 tablet twice daily after meals as prescribed.',
    foodInstructions: 'Take strictly after food with water to avoid gastric irritation.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Nausea', 'Gastric discomfort', 'Diarrhea', 'Dizziness'],
      seekMedicalHelp: ['Stomach bleeding', 'Severe skin rash', 'Difficulty breathing'],
    },
    manufacturer: 'Ipca Laboratories Ltd',
    kannada: {
      usage: 'ಮೈಕೈ ನೋವು ಮತ್ತು ಊತ ನಿವಾರಕ ಸಂಯೋಜಿತ ಮಾತ್ರೆ.',
      dosage: 'ಊಟದ ನಂತರ ದಿನಕ್ಕೆ ೨ ಬಾರಿ ೧ ಮಾತ್ರೆ.',
      foodInstructions: 'ಕಡ್ಡಾಯವಾಗಿ ಊಟದ ನಂತರ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-aciloc-150',
    brandName: 'Aciloc 150',
    genericName: 'Ranitidine',
    form: 'Tablet',
    strength: '150 mg',
    usage: 'H2-receptor antagonist reducing stomach acid for acid reflux, indigestion, and peptic ulcers.',
    dosage: '1 tablet once or twice daily before food or at bedtime.',
    foodInstructions: 'Take 30 minutes before food or at bedtime with water.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Headache', 'Constipation', 'Mild tiredness'],
      seekMedicalHelp: ['Unusual bleeding or bruising', 'Confusion', 'Severe stomach pain'],
    },
    manufacturer: 'Cadila Pharmaceuticals Ltd',
    kannada: {
      usage: 'ಅಸಿಡಿಟಿ ಮತ್ತು ಎದೆಉರಿ ನಿಯಂತ್ರಣಕ್ಕೆ ಬಳಸುವ ಔಷಧಿ.',
      dosage: 'ಊಟಕ್ಕೆ ೩೦ ನಿಮಿಷ ಮುಂಚೆ ೧ ಮಾತ್ರೆ.',
      foodInstructions: 'ಊಟಕ್ಕೆ ಮುಂಚೆ ಅಥವಾ ಮಲಗುವಾಗ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-atorva-10',
    brandName: 'Atorva 10',
    genericName: 'Atorvastatin Calcium',
    form: 'Tablet',
    strength: '10 mg',
    usage: 'Statin lipid-lowering medication for hypercholesterolemia and cardiovascular prevention.',
    dosage: '1 tablet once daily in the evening at the same time.',
    foodInstructions: 'Take with or without food. Avoid grapefruit or grapefruit juice.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Mild joint pain', 'Constipation', 'Nausea', 'Headache'],
      seekMedicalHelp: ['Unexplained muscle tenderness/weakness (rhabdomyolysis)', 'Dark urine'],
    },
    manufacturer: 'Zydus Cadila',
  },
  {
    id: 'med-telma-40',
    brandName: 'Telma 40',
    genericName: 'Telmisartan',
    form: 'Tablet',
    strength: '40 mg',
    usage: 'Angiotensin II receptor blocker (ARB) for essential hypertension and stroke prevention.',
    dosage: '1 tablet once daily in the morning with water.',
    foodInstructions: 'Take consistently with or without food at the same time daily.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Dizziness upon standing', 'Back pain', 'Sinus congestion'],
      seekMedicalHelp: ['Severe swelling of face/lips', 'Low blood pressure fainting'],
    },
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
  },
  {
    id: 'med-amlosafe-5',
    brandName: 'Amlosafe 5',
    genericName: 'Amlodipine Besylate',
    form: 'Tablet',
    strength: '5 mg',
    usage: 'Calcium channel blocker for hypertension and chronic stable angina.',
    dosage: '1 tablet once daily at the same time.',
    foodInstructions: 'Take with or without food with a full glass of water.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Swelling of ankles or feet (peripheral edema)', 'Dizziness', 'Flushing'],
      seekMedicalHelp: ['Rapid pounding heartbeat', 'Chest pain worsening'],
    },
    manufacturer: 'Aristo Pharmaceuticals Ltd',
  },
  {
    id: 'med-ecosprin-75',
    brandName: 'Ecosprin 75',
    genericName: 'Aspirin (Acetylsalicylic Acid)',
    form: 'Tablet',
    strength: '75 mg',
    usage: 'Low-dose antiplatelet cardioprotective agent preventing heart attacks and blood clots.',
    dosage: '1 tablet once daily after a main meal.',
    foodInstructions: 'Take after meals to minimize gastric ulcer risk. Swallow whole, do not crush.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Mild indigestion', 'Increased tendency to bruise/bleed'],
      seekMedicalHelp: ['Vomiting blood or coffee-ground material', 'Black tarry stools'],
    },
    manufacturer: 'USV Private Limited',
  },
  {
    id: 'med-zifi-200',
    brandName: 'Zifi 200',
    genericName: 'Cefixime',
    form: 'Tablet',
    strength: '200 mg',
    usage: 'Cephalosporin antibiotic for typhoid fever, urinary tract, and respiratory infections.',
    dosage: '1 tablet twice daily (every 12 hours) for 7 to 10 days.',
    foodInstructions: 'Take with food to increase drug absorption and reduce nausea.',
    foodTiming: 'with_food',
    sideEffects: {
      common: ['Diarrhea', 'Abdominal pain', 'Gas', 'Nausea'],
      seekMedicalHelp: ['Severe colitis diarrhea with fever', 'Allergic rash'],
    },
    manufacturer: 'FDC Limited',
  },
  {
    id: 'med-montair-lc',
    brandName: 'Montair-LC',
    genericName: 'Montelukast (10mg) + Levocetirizine (5mg)',
    form: 'Tablet',
    strength: '10mg/5mg',
    usage: 'Combined antiallergic for asthma prevention, allergic rhinitis, and chronic sneezing.',
    dosage: '1 tablet once daily at bedtime.',
    foodInstructions: 'Take with or without food at bedtime.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Drowsiness', 'Fatigue', 'Headache', 'Dry mouth'],
      seekMedicalHelp: ['Unusual mood or behavior changes', 'Severe wheezing'],
    },
    manufacturer: 'Cipla Limited',
  },

  // ==========================================
  // CAPSULES
  // ==========================================
  {
    id: 'med-omez-20',
    brandName: 'Omez 20',
    genericName: 'Omeprazole',
    form: 'Capsule',
    strength: '20 mg',
    usage: 'Proton pump inhibitor for heartburn, gastroesophageal reflux (GERD), and stomach ulcers.',
    dosage: '1 capsule once daily in the morning 30 minutes before breakfast.',
    foodInstructions: 'Take before breakfast on an empty stomach with water. Swallow capsule whole; do not chew or crush pellets.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Headache', 'Stomach ache', 'Nausea', 'Constipation'],
      seekMedicalHelp: ['Persistent watery diarrhea', 'Joint pain', 'Muscle spasms'],
    },
    manufacturer: 'Dr. Reddy\'s Laboratories Ltd',
    kannada: {
      usage: 'ಗ್ಯಾಸ್ಟ್ರಿಕ್, ಎದೆಉರಿ ಮತ್ತು ಜಠರದ ಹುಣ್ಣು (ಅಲ್ಸರ್) ನಿವಾರಕ ಕ್ಯಾಪ್ಸೂಲ್.',
      dosage: 'ಬೆಳಿಗ್ಗೆ ಉಪಹಾರಕ್ಕಿಂತ ಮುಂಚೆ ೧ ಕ್ಯಾಪ್ಸೂಲ್ ನುಂಗಿ.',
      foodInstructions: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸೇವಿಸಿ. ಕ್ಯಾಪ್ಸೂಲ್ ಅಗಿಯಬೇಡಿ.',
    },
  },
  {
    id: 'med-mox-500',
    brandName: 'Mox 500',
    genericName: 'Amoxicillin',
    form: 'Capsule',
    strength: '500 mg',
    usage: 'Broad-spectrum penicillin antibiotic treating bacterial chest, ear, throat, and urinary infections.',
    dosage: '1 capsule orally every 8 hours (3 times daily) for prescribed 5-7 days course.',
    foodInstructions: 'Take with a glass of water, with or without food. Complete the full course.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Mild diarrhea', 'Nausea', 'Vomiting', 'Headache'],
      seekMedicalHelp: ['Penicillin allergic rash', 'Swelling of throat', 'Severe watery diarrhea'],
    },
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    kannada: {
      usage: 'ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಸೋಂಕು ನಿವಾರಕ ಆಂಟಿಬಯೋಟಿಕ್ ಕ್ಯಾಪ್ಸೂಲ್.',
      dosage: 'ಪ್ರತಿ ೮ ಗಂಟೆಗೊಮ್ಮೆ ೧ ಕ್ಯಾಪ್ಸೂಲ್ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ.',
      foodInstructions: 'ಊಟದ ಜೊತೆಗೆ ಅಥವಾ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಬಹುದು. ಪೂರ್ಣ ಕೋರ್ಸ್ ಮುಗಿಸಿ.',
    },
  },
  {
    id: 'med-becosules',
    brandName: 'Becosules',
    genericName: 'B-Complex with Vitamin C',
    form: 'Capsule',
    strength: 'Multivitamin Complex',
    usage: 'Vitamin supplementation for mouth ulcers, fatigue, nutritional deficiencies, and immune support.',
    dosage: '1 capsule once daily after a major meal.',
    foodInstructions: 'Take once daily after lunch or breakfast with plenty of water.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Harmless bright yellow urine (due to Riboflavin)', 'Mild stomach upset'],
      seekMedicalHelp: ['Allergic rash (rare)'],
    },
    manufacturer: 'Pfizer Limited',
  },
  {
    id: 'med-pantodac-dsr',
    brandName: 'Pantodac-DSR',
    genericName: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
    form: 'Capsule',
    strength: '40mg/30mg',
    usage: 'Antacid and prokinetic capsule treating GERD, severe acidity, and nausea-associated reflux.',
    dosage: '1 capsule once daily in the morning 30-60 minutes before breakfast.',
    foodInstructions: 'Take strictly on an empty stomach in the morning before food. Swallow whole.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Dry mouth', 'Headache', 'Drowsiness', 'Diarrhea'],
      seekMedicalHelp: ['Heart palpitations / irregular pulse', 'Severe dizziness'],
    },
    manufacturer: 'Zydus Cadila',
  },
  {
    id: 'med-rabicip-20',
    brandName: 'Rabicip 20',
    genericName: 'Rabeprazole Sodium',
    form: 'Capsule',
    strength: '20 mg',
    usage: 'Gastric acid suppression for hyperacidity and Zollinger-Ellison syndrome.',
    dosage: '1 capsule once daily in the morning before breakfast.',
    foodInstructions: 'Take on empty stomach with water 30 minutes before food.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Nausea', 'Headache', 'Mild abdominal pain'],
      seekMedicalHelp: ['Severe allergic reaction', 'Persistent vomiting'],
    },
    manufacturer: 'Cipla Limited',
  },
  {
    id: 'med-gabapin-300',
    brandName: 'Gabapin 300',
    genericName: 'Gabapentin',
    form: 'Capsule',
    strength: '300 mg',
    usage: 'Neuropathic pain relief (diabetic neuropathy, shingles nerve pain) and anticonvulsant.',
    dosage: '1 capsule 2 to 3 times daily as titrated by neurologist.',
    foodInstructions: 'Take with or without food. Do not stop abruptly.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Dizziness', 'Drowsiness', 'Loss of coordination', 'Weight gain'],
      seekMedicalHelp: ['Severe suicidal ideation / mood changes', 'Difficulty breathing'],
    },
    manufacturer: 'Intas Pharmaceuticals Ltd',
  },

  // ==========================================
  // SYRUPS (WITH MEASURING CUP & ML DOSAGES)
  // ==========================================
  {
    id: 'med-benadryl-cough',
    brandName: 'Benadryl Cough Syrup',
    genericName: 'Diphenhydramine (14.08mg) + Ammonium Chloride (138mg) per 5ml',
    form: 'Syrup',
    strength: 'per 5 ml',
    usage: 'Relief of wet and allergic cough, chest congestion, and throat tickle.',
    dosage: 'Adults: 5 ml to 10 ml every 4 hours using measuring cup. Children (6-12y): 5 ml.',
    foodInstructions: 'Take after meals. Shake bottle well before measuring. May cause drowsiness.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Drowsiness', 'Dry mouth and throat', 'Mild dizziness', 'Nausea'],
      seekMedicalHelp: ['Extreme sedation', 'Difficulty urinating', 'Blurred vision'],
    },
    manufacturer: 'Johnson & Johnson Private Limited',
    kannada: {
      usage: 'ಕೆಮ್ಮು ಮತ್ತು ಕಫ ನಿವಾರಕ ಸಿರಪ್.',
      dosage: 'ದೊಡ್ಡವರಿಗೆ ೫ ರಿಂದ ೧೦ ಮಿಲಿ ಅಳತೆ ಕಪ್ ಬಳಸಿ ಪ್ರತಿ ೪ ಗಂಟೆಗೆ ತೆಗೆದುಕೊಳ್ಳಿ.',
      foodInstructions: 'ಬಳಸುವ ಮುನ್ನ ಬಾಟಲಿಯನ್ನು ಚೆನ್ನಾಗಿ ಕುಲುಕಿ. ಊಟದ ನಂತರ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-ascoril-ls',
    brandName: 'Ascoril-LS Syrup',
    genericName: 'Levosalbutamol (1mg) + Ambroxol (30mg) + Guaiphenesin (50mg) per 5ml',
    form: 'Syrup',
    strength: 'per 5 ml',
    usage: 'Mucolytic bronchodilator expectorant for productive wet cough, bronchitis, and asthma cough.',
    dosage: 'Adults: 5 ml to 10 ml 3 times daily using provided measuring cap.',
    foodInstructions: 'Take after meals with water. Shake well before each use.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Fine muscle tremors (hands)', 'Mild headache', 'Palpitations', 'Nausea'],
      seekMedicalHelp: ['Rapid or irregular heartbeat', 'Severe muscle cramps'],
    },
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    kannada: {
      usage: 'ಕಫ ಕರಗಿಸುವ ಮತ್ತು ಉಸಿರಾಟ ಸುಲಭಗೊಳಿಸುವ ಕೆಮ್ಮಿನ ಸಿರಪ್.',
      dosage: '೫ ರಿಂದ ೧೦ ಮಿಲಿ ಅಳತೆ ಕಪ್‌ನೊಂದಿಗೆ ದಿನಕ್ಕೆ ೩ ಬಾರಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಬಾಟಲಿ ಚೆನ್ನಾಗಿ ಕುಲುಕಿ.',
    },
  },
  {
    id: 'med-grilinctus-syrup',
    brandName: 'Grilinctus Syrup',
    genericName: 'Dextromethorphan + Chlorpheniramine + Guaifenesin + Ammonium Chloride',
    form: 'Syrup',
    strength: 'per 5 ml',
    usage: 'Comprehensive relief of dry irritating cough, throat tickle, and cold congestion.',
    dosage: 'Adults: 5 ml 3 to 4 times a day using measuring cap.',
    foodInstructions: 'Take after food. Avoid driving as it may cause slight drowsiness.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Drowsiness', 'Lightheadedness', 'Mild stomach upset'],
      seekMedicalHelp: ['Severe dizziness', 'Excitation in small children'],
    },
    manufacturer: 'Franco-Indian Pharmaceuticals Pvt Ltd',
  },
  {
    id: 'med-corex-dx',
    brandName: 'Corex-DX Syrup',
    genericName: 'Dextromethorphan Hydrobromide (10mg) + Chlorpheniramine Maleate (4mg) per 5ml',
    form: 'Syrup',
    strength: 'per 5 ml',
    usage: 'Dry non-productive cough suppressant and antiallergic syrup.',
    dosage: 'Adults: 5 ml every 6 to 8 hours using calibrated measuring cup.',
    foodInstructions: 'Take with or after food. Shake well before use.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Drowsiness', 'Dry mouth', 'Nausea', 'Blurred vision'],
      seekMedicalHelp: ['Extreme sleepiness', 'Slow breathing'],
    },
    manufacturer: 'Pfizer Limited',
  },
  {
    id: 'med-gelusil-mps',
    brandName: 'Gelusil MPS Antacid',
    genericName: 'Aluminium Hydroxide + Magnesium Hydroxide + Dimethicone',
    form: 'Syrup',
    strength: 'Antacid Oral Suspension',
    usage: 'Instant relief from stomach acidity, heartburn, gas, and indigestion.',
    dosage: '1 to 2 teaspoonfuls (5 ml - 10 ml) between meals or before bedtime as needed.',
    foodInstructions: 'Take 30 to 60 minutes after meals or at bedtime. Shake bottle vigorously before pouring.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Chalky taste', 'Mild constipation or loose stools'],
      seekMedicalHelp: ['Severe stomach cramps', 'Loss of appetite'],
    },
    manufacturer: 'Pfizer Limited',
  },
  {
    id: 'med-duphalac-syrup',
    brandName: 'Duphalac Syrup',
    genericName: 'Lactulose Solution USP',
    form: 'Syrup',
    strength: '3.335 g / 5 ml',
    usage: 'Osmotic laxative for chronic constipation and hepatic encephalopathy management.',
    dosage: '15 ml to 30 ml once daily in the morning with breakfast, adjusted as advised.',
    foodInstructions: 'May be taken with water, fruit juice, or milk with breakfast. Drink plenty of water throughout the day.',
    foodTiming: 'with_food',
    sideEffects: {
      common: ['Flatulence / gas in initial days', 'Mild abdominal cramps', 'Nausea'],
      seekMedicalHelp: ['Severe diarrhea causing dehydration', 'Electrolyte imbalance'],
    },
    manufacturer: 'Abbott Healthcare Pvt Ltd',
  },
  {
    id: 'med-zincovit-syrup',
    brandName: 'Zincovit Syrup',
    genericName: 'Multivitamin and Multimineral with Zinc',
    form: 'Syrup',
    strength: 'per 5 ml',
    usage: 'Nutritional restorative syrup enhancing immunity, appetite, and recovery after illness.',
    dosage: 'Children (>1y): 5 ml once daily. Adults: 10 ml once daily after meals.',
    foodInstructions: 'Take once daily after a main meal using measuring spoon.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Mild nausea if taken on empty stomach'],
      seekMedicalHelp: ['Allergic swelling (extremely rare)'],
    },
    manufacturer: 'Apex Laboratories Ltd',
  },
  {
    id: 'med-cremaffin-syrup',
    brandName: 'Cremaffin Syrup',
    genericName: 'Liquid Paraffin + Magnesium Hydroxide Suspension',
    form: 'Syrup',
    strength: 'Oral Emulsion',
    usage: 'Gentle overnight constipation relief and bowel evacuation.',
    dosage: 'Adults: 15 ml to 30 ml at bedtime with a glass of water.',
    foodInstructions: 'Take at bedtime with water. Do not lie down immediately after taking.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Mild abdominal cramps', 'Nausea'],
      seekMedicalHelp: ['Anal leakage on high dosage', 'Chronic laxative dependency'],
    },
    manufacturer: 'Abbott Healthcare Pvt Ltd',
  },

  // ==========================================
  // INJECTIONS
  // ==========================================
  {
    id: 'med-insulin-glargine',
    brandName: 'Lantus',
    genericName: 'Insulin Glargine',
    form: 'Injection',
    strength: '100 units/ml (U-100)',
    usage: 'Long-acting basal insulin for glycemic control in Type 1 and Type 2 Diabetes.',
    dosage: 'Administer subcutaneously once daily at the same time every day. Dose customized per physician titration.',
    foodInstructions: 'Inject subcutaneously in abdomen, thigh, or upper arm. Rotate injection sites daily.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Hypoglycemia (sweating, trembling, hunger, confusion)', 'Injection site redness/lipodystrophy'],
      seekMedicalHelp: ['Severe low blood sugar coma', 'Generalized anaphylactic rash'],
    },
    manufacturer: 'Sanofi India Ltd',
  },
  {
    id: 'med-monocef-1g',
    brandName: 'Monocef 1g',
    genericName: 'Ceftriaxone Sodium',
    form: 'Injection',
    strength: '1 g / vial',
    usage: 'Third-generation cephalosporin injectable antibiotic for severe sepsis, typhoid, meningitis, and pneumonia.',
    dosage: '1 g to 2 g once daily via IV infusion or deep intramuscular injection under medical supervision.',
    foodInstructions: 'Administered under hospital/clinical supervision. Food restrictions as directed by clinician.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Injection site pain/phlebitis', 'Diarrhea', 'Mild nausea'],
      seekMedicalHelp: ['Immediate anaphylaxis', 'Clostridioides difficile diarrhea'],
    },
    manufacturer: 'Aristo Pharmaceuticals Ltd',
  },
  {
    id: 'med-voveran-aq',
    brandName: 'Voveran-AQ',
    genericName: 'Diclofenac Sodium',
    form: 'Injection',
    strength: '75 mg / ml',
    usage: 'Intramuscular NSAID analgesic for acute renal colic, post-surgical pain, and acute orthopedic trauma.',
    dosage: '75 mg (1 ampoule) by deep intragluteal injection. Maximum 150 mg in 24 hours for short duration.',
    foodInstructions: 'Administered in clinical settings by trained healthcare provider.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Burning sensation at injection site', 'Dizziness', 'Headache'],
      seekMedicalHelp: ['Gastrointestinal ulceration/bleeding', 'Anaphylactoid reaction'],
    },
    manufacturer: 'Novartis India Ltd',
  },
  {
    id: 'med-emset-injection',
    brandName: 'Emset 4mg',
    genericName: 'Ondansetron Hydrochloride',
    form: 'Injection',
    strength: '2 mg/ml (2 ml ampoule)',
    usage: '5-HT3 receptor antagonist preventing severe nausea and vomiting from chemotherapy, radiation, and surgery.',
    dosage: '4 mg to 8 mg administered slowly by IV or IM injection before surgical anesthesia or chemotherapy.',
    foodInstructions: 'Administered by nurse or healthcare practitioner.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Headache', 'Constipation', 'Flushing sensation'],
      seekMedicalHelp: ['ECG QT prolongation', 'Transient blindness/vision disturbance'],
    },
    manufacturer: 'Cipla Limited',
  },
  {
    id: 'med-tetanus-toxoid',
    brandName: 'TT Vaccine',
    genericName: 'Tetanus Toxoid Adsorbed',
    form: 'Injection',
    strength: '0.5 ml / dose',
    usage: 'Active immunization and prophylaxis against Clostridium tetani wound infection.',
    dosage: '0.5 ml intramuscularly in deltoid muscle as booster or primary vaccination.',
    foodInstructions: 'No food restrictions. Administered by health professional.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Soreness and swelling in upper arm', 'Mild fever'],
      seekMedicalHelp: ['Severe allergic reaction (urticaria/wheezing)'],
    },
    manufacturer: 'Serum Institute of India Pvt Ltd',
  },
  {
    id: 'med-optineuron-inj',
    brandName: 'Optineuron',
    genericName: 'Vitamin B1, B6, B12, Riboflavin, Niacinamide and D-Panthenol',
    form: 'Injection',
    strength: '3 ml ampoule',
    usage: 'Parenteral treatment of severe vitamin B deficiency, peripheral neuropathy, and diabetic nerve recovery.',
    dosage: '1 ampoule intramuscularly on alternate days or as prescribed by neurologist.',
    foodInstructions: 'Administered intramuscularly by medical professional.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Pain at injection site', 'Transient warmth'],
      seekMedicalHelp: ['Allergic reaction'],
    },
    manufacturer: 'Lupin Limited',
  },
  {
    id: 'med-decaneuramin',
    brandName: 'Deca-Durabolin',
    genericName: 'Nandrolone Decanoate',
    form: 'Injection',
    strength: '50 mg / ml',
    usage: 'Anabolic steroid for severe post-menopausal osteoporosis and refractory anemia.',
    dosage: '50 mg every 3 weeks by deep intramuscular injection under strict medical guidance.',
    foodInstructions: 'Administered under specialist clinical prescription only.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Fluid retention', 'Mild acne', 'Nausea'],
      seekMedicalHelp: ['Liver function abnormalities', 'Cardiovascular strain'],
    },
    manufacturer: 'Organon India Ltd',
  },
  {
    id: 'med-pantocid-iv',
    brandName: 'Pantocid IV',
    genericName: 'Pantoprazole Sodium for Injection',
    form: 'Injection',
    strength: '40 mg / vial',
    usage: 'Intravenous acid suppression for acute upper gastrointestinal bleeding and severe GERD.',
    dosage: '40 mg IV slowly over 2-15 minutes once or twice daily in hospital.',
    foodInstructions: 'Administered via IV line by healthcare staff.',
    foodTiming: 'general',
    sideEffects: {
      common: ['Injection site thrombophlebitis', 'Headache', 'Diarrhea'],
      seekMedicalHelp: ['Severe hypersensitivity rash', 'C. difficile infection'],
    },
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
  },
  {
    id: 'med-telma-40',
    brandName: 'Telma 40',
    genericName: 'Telmisartan',
    form: 'Tablet',
    strength: '40 mg',
    usage: 'Antihypertensive medication for managing high blood pressure and cardiovascular protection.',
    dosage: '1 tablet once daily, preferably at the same time every morning.',
    foodInstructions: 'Take with or without food with a full glass of water.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Dizziness', 'Upper respiratory congestion', 'Back pain'],
      seekMedicalHelp: ['Swelling of hands/feet', 'Hyperkalemia symptoms (irregular pulse)'],
    },
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    kannada: {
      usage: 'ರಕ್ತದೊತ್ತಡ (BP) ನಿಯಂತ್ರಿಸಲು ಬಳಸುವ ಮಾತ್ರೆ.',
      dosage: 'ದಿನಕ್ಕೆ ೧ ಮಾತ್ರೆ ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಸೇವಿಸಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಅಥವಾ ಮುಂಚೆ ಒಂದು ಲೋಟ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-ecosprin-75',
    brandName: 'Ecosprin 75',
    genericName: 'Aspirin (Acetylsalicylic Acid)',
    form: 'Tablet',
    strength: '75 mg',
    usage: 'Antiplatelet therapy for prevention of heart attacks, stroke, and arterial thrombosis.',
    dosage: '1 tablet once daily after meals. Swallow whole, do not crush or chew.',
    foodInstructions: 'Take with or immediately after food to prevent stomach irritation.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Mild indigestion', 'Heartburn', 'Increased bleeding tendency'],
      seekMedicalHelp: ['Black tarry stools (GI bleeding)', 'Severe stomach pain', 'Allergic rash'],
    },
    manufacturer: 'USV Private Limited',
    kannada: {
      usage: 'ಹೃದಯಾಘಾತ ತಡೆಗಟ್ಟಲು ಮತ್ತು ರಕ್ತ ತೆಳುಮಾಡಲು ಬಳಸುವ ಆಸ್ಪಿರಿನ್ ಮಾತ್ರೆ.',
      dosage: 'ದಿನಕ್ಕೆ ೧ ಮಾತ್ರೆ ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಮಾತ್ರೆಯನ್ನು ಪುಡಿಮಾಡಬೇಡಿ.',
      foodInstructions: 'ಹೊಟ್ಟೆಯುರಿ ತಪ್ಪಿಸಲು ಊಟದ ನಂತರ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-thyronorm-50',
    brandName: 'Thyronorm 50',
    genericName: 'Levothyroxine Sodium',
    form: 'Tablet',
    strength: '50 mcg',
    usage: 'Thyroid hormone replacement therapy for primary and secondary hypothyroidism.',
    dosage: '1 tablet daily in the morning on an empty stomach at least 30 to 60 minutes before breakfast.',
    foodInstructions: 'Take on an empty stomach with plain water at least 30 minutes before morning tea, coffee, or food.',
    foodTiming: 'empty_stomach',
    sideEffects: {
      common: ['Weight changes', 'Palpitations', 'Nervousness', 'Headache'],
      seekMedicalHelp: ['Chest pain', 'Rapid irregular heartbeat', 'Shortness of breath'],
    },
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    kannada: {
      usage: 'ಥೈರಾಯ್ಡ್ ಕೊರತೆಯನ್ನು ನಿವಾರಿಸಲು ಬಳಸುವ ಹಾರ್ಮೋನ್ ಮಾತ್ರೆ.',
      dosage: 'ಬೆಳಿಗ್ಗೆ ಎದ್ದ ಕೂಡಲೇ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ೧ ಮಾತ್ರೆ ಸೇವಿಸಿ.',
      foodInstructions: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸೇವಿಸಿ. ಕಾಫಿ, ಟೀ ಅಥವಾ ತಿಂಡಿಗೆ ಅರ್ಧ ಗಂಟೆ ಮುಂಚೆ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-cifran-500',
    brandName: 'Cifran 500',
    genericName: 'Ciprofloxacin',
    form: 'Tablet',
    strength: '500 mg',
    usage: 'Broad-spectrum fluoroquinolone antibiotic for bacterial urinary tract, respiratory, and skin infections.',
    dosage: '1 tablet twice daily every 12 hours for 5 to 7 days. Complete full course.',
    foodInstructions: 'Take with plenty of water. Avoid milk, yogurt, and antacids within 2 hours of dose.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Nausea', 'Diarrhea', 'Mild dizziness', 'Headache'],
      seekMedicalHelp: ['Tendon pain or swelling', 'Severe watery diarrhea', 'Burning nerve pain'],
    },
    manufacturer: 'Sun Pharmaceutical Industries Ltd',
    kannada: {
      usage: 'ಬ್ಯಾಕ್ಟೀರಿಯಾ ಸೋಂಕುಗಳಿಗೆ ನೀಡುವ ಆಂಟಿಬಯೋಟಿಕ್ ಮಾತ್ರೆ.',
      dosage: 'ದಿನಕ್ಕೆ ೨ ಬಾರಿ (ಬೆಳಿಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ) ೧ ಮಾತ್ರೆ ಸೇವಿಸಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಹಾಲಿನ ಪದಾರ್ಥಗಳೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.',
    },
  },
  {
    id: 'med-supradyn-daily',
    brandName: 'Supradyn Daily',
    genericName: 'Multivitamins and Multiminerals with Zinc',
    form: 'Tablet',
    strength: 'Standard Formulation',
    usage: 'Daily nutritional supplement for vitality, immune defense, and micronutrient support.',
    dosage: '1 tablet once daily after breakfast or lunch with plenty of water.',
    foodInstructions: 'Take with or after food with water.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Bright yellow urine (harmless B2 excretion)', 'Mild nausea'],
      seekMedicalHelp: ['Allergic swelling', 'Severe rash'],
    },
    manufacturer: 'Bayer Pharmaceuticals',
    kannada: {
      usage: 'ಶಕ್ತಿ ಮತ್ತು ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ಹೆಚ್ಚಿಸಲು ವಿಟಮಿನ್ ಮಾತ್ರೆ.',
      dosage: 'ದಿನಕ್ಕೆ ೧ ಮಾತ್ರೆ ಊಟದ ನಂತರ ಸೇವಿಸಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ.',
    },
  },
  {
    id: 'med-alex-syrup',
    brandName: 'Alex Syrup',
    genericName: 'Dextromethorphan HBr, Chlorpheniramine Maleate, Phenylephrine',
    form: 'Syrup',
    strength: '100 ml',
    usage: 'Relief of dry irritating cough, nasal congestion, and allergic symptoms in cold and flu.',
    dosage: '5 ml to 10 ml 3 times daily using calibrated measuring cup. Shake well before use.',
    foodInstructions: 'Take after meals. Shake bottle well before measuring. May cause drowsiness.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Drowsiness', 'Dry mouth', 'Mild dizziness'],
      seekMedicalHelp: ['Rapid heartbeat', 'Difficulty urinating', 'Confusion'],
    },
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    kannada: {
      usage: 'ಒಣ ಕೆಮ್ಮು ಮತ್ತು ನೆಗಡಿ ಶಮನಕ್ಕೆ ಬಳಸುವ ಸಿರಪ್.',
      dosage: '೫ ರಿಂದ ೧೦ ಮಿ.ಲಿ ದಿನಕ್ಕೆ ೩ ಬಾರಿ ಅಳತೆ ಕಪ್ ಬಳಸಿ ಕುಡಿಯಿರಿ. ಚೆನ್ನಾಗಿ ಕುಲುಕಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಬಾಟಲಿಯನ್ನು ಚೆನ್ನಾಗಿ ಕುಲುಕಿ.',
    },
  },
  {
    id: 'med-tusq-d-syrup',
    brandName: 'TusQ-D Syrup',
    genericName: 'Dextromethorphan with Phenylephrine and Chlorpheniramine',
    form: 'Syrup',
    strength: '100 ml',
    usage: 'Cough suppressant and decongestant for dry allergic cough and upper respiratory irritation.',
    dosage: '5 ml to 10 ml (1-2 teaspoonfuls) 3 times daily. Shake well before use.',
    foodInstructions: 'Take after food. Shake well before measuring with cup.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Sleepiness', 'Lightheadedness', 'Nausea'],
      seekMedicalHelp: ['Allergic breathing difficulty', 'Severe restlessness'],
    },
    manufacturer: 'Blue Cross Laboratories Ltd',
    kannada: {
      usage: 'ಕೆಮ್ಮು ಮತ್ತು ಕಫ ಕಡಿಮೆ ಮಾಡಲು ಸಿರಪ್.',
      dosage: '೫ ರಿಂದ ೧೦ ಮಿ.ಲಿ ಅಳತೆ ಕಪ್ ನಿಂದ ದಿನಕ್ಕೆ ೩ ಬಾರಿ ಸೇವಿಸಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಮುಂಚೆ ಚೆನ್ನಾಗಿ ಕುಲುಕಿ.',
    },
  },
  {
    id: 'med-liv-52-syrup',
    brandName: 'Liv.52 Syrup',
    genericName: 'Herbal Hepatoprotective Formulation',
    form: 'Syrup',
    strength: '200 ml',
    usage: 'Ayurvedic hepatoprotective syrup supporting liver health, appetite, and metabolic function.',
    dosage: '10 ml (2 teaspoonfuls) twice or thrice daily before meals. Shake well before use.',
    foodInstructions: 'Take 15-30 minutes before food. Shake bottle thoroughly before pouring.',
    foodTiming: 'before_food',
    sideEffects: {
      common: ['Generally very well tolerated', 'Rare mild laxative effect'],
      seekMedicalHelp: ['Unusual skin itching'],
    },
    manufacturer: 'The Himalaya Drug Company',
    kannada: {
      usage: 'ಯಕೃತ್ತು (ಲಿವರ್) ಮತ್ತು ಹಸಿವು ಸುಧಾರಿಸಲು ನೈಸರ್ಗಿಕ ಸಿರಪ್.',
      dosage: '೧೦ ಮಿ.ಲಿ ದಿನಕ್ಕೆ ೨-೩ ಬಾರಿ ಊಟಕ್ಕೆ ಮುಂಚೆ ಸೇವಿಸಿ.',
      foodInstructions: 'ಊಟಕ್ಕೆ ೧೫-೩೦ ನಿಮಿಷಗಳ ಮುಂಚೆ ಸೇವಿಸಿ. ಚೆನ್ನಾಗಿ ಕುಲುಕಿ.',
    },
  },
  {
    id: 'med-becosules-capsule',
    brandName: 'Becosules Capsule',
    genericName: 'Vitamin B-Complex with Vitamin C',
    form: 'Capsule',
    strength: 'Standard Formulation',
    usage: 'Treatment and prevention of vitamin B and C deficiencies, mouth ulcers, and post-illness weakness.',
    dosage: '1 capsule daily after food with a full glass of water. Swallow whole.',
    foodInstructions: 'Take after food. Do not chew or crush capsule.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Bright yellow urine', 'Mild stomach upset'],
      seekMedicalHelp: ['Allergic rash', 'Facial swelling'],
    },
    manufacturer: 'Pfizer Limited',
    kannada: {
      usage: 'ಬಾಯಿ ಹುಣ್ಣು ಮತ್ತು ವಿಟಮಿನ್ ಬಿ ಕೊರತೆಗೆ ಬಳಸುವ ಕ್ಯಾಪ್ಸೂಲ್.',
      dosage: 'ದಿನಕ್ಕೆ ೧ ಕ್ಯಾಪ್ಸೂಲ್ ಊಟದ ನಂತರ ನೀರಿನೊಂದಿಗೆ ನುಂಗಿ.',
      foodInstructions: 'ಊಟದ ನಂತರ ಸೇವಿಸಿ. ಕ್ಯಾಪ್ಸೂಲ್ ಮುರಿಯಬೇಡಿ.',
    },
  },
  {
    id: 'med-darolac-capsule',
    brandName: 'Darolac Capsule',
    genericName: 'Lactobacillus and Probiotic Blend',
    form: 'Capsule',
    strength: '1.25 Billion Spores',
    usage: 'Probiotic for restoring healthy gut flora during or after antibiotic courses and diarrhea.',
    dosage: '1 capsule twice daily. Swallow whole with water.',
    foodInstructions: 'Take with or after food. Do not take with very hot beverages.',
    foodTiming: 'after_food',
    sideEffects: {
      common: ['Mild abdominal gas during initial days', 'Mild bloating'],
      seekMedicalHelp: ['High fever', 'Severe abdominal pain'],
    },
    manufacturer: 'Aristo Pharmaceuticals Pvt Ltd',
    kannada: {
      usage: 'ಹೊಟ್ಟೆಯ ಆರೋಗ್ಯ ಮತ್ತು ಜೀರ್ಣಕ್ರಿಯೆ ಸುಧಾರಿಸುವ ಪ್ರೋಬಯಾಟಿಕ್ ಕ್ಯಾಪ್ಸೂಲ್.',
      dosage: 'ದಿನಕ್ಕೆ ೨ ಬಾರಿ ೧ ಕ್ಯಾಪ್ಸೂಲ್ ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.',
      foodInstructions: 'ಊಟದೊಂದಿಗೆ ಅಥವಾ ನಂತರ ಸೇವಿಸಿ.',
    },
  },
];

/**
 * Searches the local seed dataset FIRST.
 * Checks both brand name and generic name against query.
 */
export function findLocalMedicine(query: string): LocalMedicine | null {
  if (!query || query.trim().length < 2) return null;
  const clean = query.trim().toLowerCase().replace(/[-_]/g, ' ');

  // 1. Exact match on brand or generic
  for (const med of LOCAL_MEDICINES) {
    const brandClean = med.brandName.toLowerCase().replace(/[-_]/g, ' ');
    const genericClean = med.genericName.toLowerCase().replace(/[-_]/g, ' ');
    if (brandClean === clean || genericClean === clean) {
      return med;
    }
  }

  // 2. Base brand name match (e.g., query "Dolo-650" matches "dolo")
  for (const med of LOCAL_MEDICINES) {
    const brandClean = med.brandName.toLowerCase().replace(/[-_]/g, ' ');
    const genericClean = med.genericName.toLowerCase().replace(/[-_]/g, ' ');
    if (clean.includes(brandClean) || brandClean.includes(clean)) {
      return med;
    }
    if (clean.includes(genericClean) || genericClean.includes(clean)) {
      return med;
    }
  }

  // 3. Word token overlap
  const queryTokens = clean.split(' ').filter((w) => w.length >= 3);
  for (const med of LOCAL_MEDICINES) {
    const brandTokens = med.brandName.toLowerCase().replace(/[-_]/g, ' ').split(' ');
    const genericTokens = med.genericName.toLowerCase().replace(/[-_]/g, ' ').split(' ');
    const allTokens = [...brandTokens, ...genericTokens];

    for (const q of queryTokens) {
      if (allTokens.some((t) => t === q || (t.length >= 4 && q.startsWith(t)))) {
        return med;
      }
    }
  }

  return null;
}
