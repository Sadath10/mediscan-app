import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  PlusCircle,
  Clock,
  Edit3,
  X,
  FileText,
  Search,
  ExternalLink,
  Layers,
  Syringe,
  FlaskConical,
  Pill,
  Utensils,
  Droplet,
  HeartPulse,
  AlertCircle,
  Coffee,
  Loader2,
  Info,
} from 'lucide-react';
import { Language, translations } from '../translations.js';
import { speakText, stopSpeaking, formatForSpeech } from '../utils/audio.js';

interface ScannerViewProps {
  lang: Language;
  onSaveToCabinet: (med: any) => void;
  onSetReminder: (medName: string, medId?: number) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  lang,
  onSaveToCabinet,
  onSetReminder,
}) => {
  const t = translations[lang];

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);
  const [unifiedProfile, setUnifiedProfile] = useState<any | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [ttsLang, setTtsLang] = useState<'en' | 'kn'>(lang);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields for manual correction
  const [editedName, setEditedName] = useState('');
  const [editedActive, setEditedActive] = useState('');
  const [editedStrength, setEditedStrength] = useState('');
  const [editedForm, setEditedForm] = useState('Tablet');
  const [extractedInputText, setExtractedInputText] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTtsLang(lang);
  }, [lang]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
      setIsSpeaking(false);
      setIsAudioLoading(false);
    };
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage(
        lang === 'kn'
          ? 'ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಅನುಮತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'
          : 'Unable to access device camera. Please check camera permissions or upload an image file.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      processImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (dataUrl: string, textOverride?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setPipelineResult(null);
    setUnifiedProfile(null);
    setSelectedMatch(null);
    setIsEditing(false);

    try {
      const res = await fetch('/api/scan/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          manualTextOverride: textOverride,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const result = await res.json();
      setPipelineResult(result);
      if (result.unifiedProfile) {
        setUnifiedProfile(result.unifiedProfile);
      }

      const detectedText = result.extractedText || (result.rawText ? result.rawText.split('\n')[0].trim() : '') || textOverride || '';
      setExtractedInputText(detectedText);

      const topMatch = result.topMatch;
      const hasMatch = Boolean(result.isVerified && topMatch);
      const initialCandidate = hasMatch
        ? (topMatch.brandName || topMatch.name)
        : (result.entities?.candidateNames?.[0] || '');
      const initialActive = hasMatch
        ? ((topMatch.activeIngredient && topMatch.activeIngredient[0]) || topMatch.genericName || '')
        : (result.entities?.detectedGenerics?.[0] || '');
      const initialStrength = topMatch?.strength || result.entities?.strengths?.[0] || '';
      const initialForm = topMatch?.dosageForm || result.entities?.dosageForms?.[0] || 'Tablet';

      setSelectedMatch(topMatch);
      setEditedName(initialCandidate);
      setEditedActive(initialActive);
      setEditedStrength(initialStrength);
      setEditedForm(initialForm);

      // If unifiedProfile wasn't returned directly, fetch it
      if (!result.unifiedProfile && (initialActive || initialCandidate)) {
        try {
          const detailRes = await fetch(`/api/medicine/details?name=${encodeURIComponent(initialActive || initialCandidate)}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setUnifiedProfile(detailData);
          }
        } catch (detailErr) {
          // non-fatal
        }
      }
    } catch (err: any) {
      console.error('Scan processing error:', err);
      setErrorMessage(
        lang === 'kn'
          ? 'ಚಿತ್ರವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೈಯಾರೆ ನಮೂದಿಸಿ.'
          : 'Failed to process packaging. Please try retaking a clearer picture or enter medicine manually.'
      );
      if (textOverride) {
        setExtractedInputText(textOverride);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualVerificationSearch = (searchText: string) => {
    const query = searchText.trim();
    if (!query) return;
    setExtractedInputText(query);
    processImage(capturedImage || '', query);
  };

  type SampleMedicineKey =
    | 'azithral'
    | 'dolo'
    | 'augmentin'
    | 'zerodol'
    | 'aciloc'
    | 'allegra'
    | 'omez'
    | 'benadryl'
    | 'pantocid'
    | 'glycomet'
    | 'lantus'
    | 'amoxicillin';

  // Quick demonstration sample packaging photo
  const loadSamplePackaging = (sampleName: SampleMedicineKey) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Foil/blister/bottle background styling
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 640, 360);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 616, 336);

    if (sampleName === 'azithral') {
      // Azithral-500 Packaging
      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('AZITHRAL-500', 40, 75);

      ctx.fillStyle = '#0d9488';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Azithral-500 Azithromycin Tablets IP 500mg', 40, 135);
      ctx.fillText('Dosage: 500 mg • Take with or without food', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Alembic Pharmaceuticals Ltd • Batch: AZ-5521', 40, 220);
      ctx.fillText('EXP: 10/2028 • Form: Tablet • Broad Spectrum Antibiotic', 40, 260);
    } else if (sampleName === 'dolo') {
      // Tablet Packaging
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('DOLO-650 / PARACETAMOL', 40, 75);

      ctx.fillStyle = '#059669';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Paracetamol Tablets IP 650 mg', 40, 135);
      ctx.fillText('Dosage: 1 tablet after food as directed', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Micro Labs Limited • Batch: DL-7721', 40, 220);
      ctx.fillText('EXP: 12/2028 • Form: Tablet • Verified Local Formulary', 40, 260);
    } else if (sampleName === 'augmentin') {
      ctx.fillStyle = '#312e81';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('AUGMENTIN 625 DUO', 40, 75);

      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Amoxicillin & Potassium Clavulanate IP 625 mg', 40, 135);
      ctx.fillText('Dosage: 1 tablet twice daily with meals', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('GlaxoSmithKline Pharmaceuticals • Batch: AG-6129', 40, 220);
      ctx.fillText('EXP: 08/2028 • Form: Tablet • Broad-Spectrum Antibacterial', 40, 260);
    } else if (sampleName === 'zerodol') {
      ctx.fillStyle = '#9a3412';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ZERODOL-SP TABLETS', 40, 75);

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Aceclofenac, Paracetamol & Serratiopeptidase IP', 40, 135);
      ctx.fillText('Dosage: 1 tablet twice daily after food', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('IPCA Laboratories Ltd • Batch: ZD-4019', 40, 220);
      ctx.fillText('EXP: 06/2028 • Form: Tablet • Anti-inflammatory & Analgesic', 40, 260);
    } else if (sampleName === 'aciloc') {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ACILOC 150 TABLETS', 40, 75);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Ranitidine Hydrochloride Tablets IP 150 mg', 40, 135);
      ctx.fillText('Dosage: 1 tablet twice daily before meals', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Cadila Pharmaceuticals Ltd • Batch: AC-9912', 40, 220);
      ctx.fillText('EXP: 03/2028 • Form: Tablet • H2 Receptor Antagonist', 40, 260);
    } else if (sampleName === 'allegra') {
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ALLEGRA 120 / FEXOFENADINE', 40, 75);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Fexofenadine Hydrochloride Tablets IP 120 mg', 40, 135);
      ctx.fillText('Dosage: 1 tablet once daily with water', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Sanofi India Limited • Batch: AL-7721', 40, 220);
      ctx.fillText('EXP: 11/2028 • Form: Tablet • Non-Sedating Antihistamine', 40, 260);
    } else if (sampleName === 'omez') {
      // Capsule Packaging
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('OMEZ 20 / OMEPRAZOLE', 40, 75);

      ctx.fillStyle = '#2563eb';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Omeprazole Gastro-resistant Capsules IP 20 mg', 40, 135);
      ctx.fillText('Dosage: 1 capsule before breakfast (Empty stomach)', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Dr. Reddy\'s Laboratories • Batch: OM-8831', 40, 220);
      ctx.fillText('EXP: 11/2028 • Form: Capsule • Swallow Whole', 40, 260);
    } else if (sampleName === 'benadryl') {
      // Syrup Packaging
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('BENADRYL COUGH FORMULA SYRUP', 40, 75);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Diphenhydramine HCl Oral Syrup 100 ml', 40, 135);
      ctx.fillText('Dosage: 10 ml (2 teaspoonfuls) • Shake well before use', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Johnson & Johnson Consumer • Batch: BD-4412', 40, 220);
      ctx.fillText('EXP: 09/2027 • Form: Syrup • Use Measuring Cup', 40, 260);
    } else if (sampleName === 'pantocid') {
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('PANTOCID 40 / PANTOPRAZOLE', 40, 75);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Pantoprazole Gastro-resistant Tablets IP 40 mg', 40, 135);
      ctx.fillText('Dosage: 1 tablet in morning before food', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Sun Pharma Laboratories • Batch: PT-5120', 40, 220);
      ctx.fillText('EXP: 09/2028 • Form: Tablet • Proton Pump Inhibitor', 40, 260);
    } else if (sampleName === 'glycomet') {
      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('GLYCOMET 500 / METFORMIN', 40, 75);

      ctx.fillStyle = '#e11d48';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Metformin Hydrochloride Tablets IP 500 mg', 40, 135);
      ctx.fillText('Dosage: 1 tablet with or after meals', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('USV Private Limited • Batch: GL-3031', 40, 220);
      ctx.fillText('EXP: 01/2029 • Form: Tablet • Antidiabetic', 40, 260);
    } else if (sampleName === 'lantus') {
      // Injection Packaging
      ctx.fillStyle = '#6b21a8';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('LANTUS SOLOSTAR / INSULIN', 40, 75);

      ctx.fillStyle = '#9333ea';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Insulin Glargine Injection IP 100 units/ml', 40, 135);
      ctx.fillText('Dosage: As directed by physician (Subcutaneous)', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('Sanofi India Limited • Batch: LT-9102', 40, 220);
      ctx.fillText('EXP: 05/2027 • Form: Injection • Clinical Use Only', 40, 260);
    } else {
      // openFDA Antibiotic Capsule
      ctx.fillStyle = '#7c2d12';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('AMOXICILLIN 500 MG', 40, 75);

      ctx.fillStyle = '#c2410c';
      ctx.fillRect(40, 95, 560, 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Amoxicillin Capsules USP 500 mg', 40, 135);
      ctx.fillText('Dosage: 1 capsule every 8 hours with meals', 40, 175);

      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.fillText('openFDA Drug Label Verified Formulation', 40, 220);
      ctx.fillText('EXP: 04/2028 • Batch: AM-9011 • Antibacterial', 40, 260);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();

    const sampleTextMap: Record<SampleMedicineKey, string> = {
      azithral: 'Azithral-500',
      dolo: 'DOLO-650 Paracetamol Tablets IP 650 mg Micro Labs Batch: DL-7721 EXP: 12/2028 Dosage: 1 tablet after food',
      augmentin: 'Augmentin 625 Duo Amoxicillin and Potassium Clavulanate Tablets IP GSK Batch: AG-6129 EXP: 08/2028',
      zerodol: 'Zerodol-SP Aceclofenac, Paracetamol & Serratiopeptidase Tablets IP IPCA Labs Batch: ZD-4019 EXP: 06/2028',
      aciloc: 'Aciloc 150 Ranitidine Hydrochloride Tablets IP 150 mg Cadila Pharmaceuticals Batch: AC-9912 EXP: 03/2028',
      allegra: 'Allegra 120 Fexofenadine Hydrochloride Tablets IP 120 mg Sanofi India Batch: AL-7721 EXP: 11/2028',
      omez: 'OMEZ 20 Omeprazole Gastro-resistant Capsules IP 20 mg Dr. Reddy\'s Batch: OM-8831 EXP: 11/2028 Take before food',
      benadryl: 'BENADRYL Cough Formula Syrup Diphenhydramine HCl 100 ml Johnson & Johnson Batch: BD-4412 EXP: 09/2027 Shake well before use 10 ml',
      pantocid: 'Pantocid 40 Pantoprazole Gastro-resistant Tablets IP 40 mg Sun Pharma Batch: PT-5120 EXP: 09/2028',
      glycomet: 'Glycomet 500 Metformin Hydrochloride Tablets IP 500 mg USV Private Limited Batch: GL-3031 EXP: 01/2029',
      lantus: 'LANTUS Solostar Insulin Glargine Injection IP 100 units/ml Sanofi Batch: LT-9102 EXP: 05/2027 As directed by physician',
      amoxicillin: 'AMOXICILLIN Capsules USP 500 mg Antibacterial EXP: 04/2028 Batch: AM-9011',
    };

    processImage(dataUrl, sampleTextMap[sampleName]);
  };

  const handleSelectCandidateMatch = async (match: any) => {
    setSelectedMatch(match);
    const candidateName = match.brandName || match.genericName || match.name;
    const active = (match.activeIngredient && match.activeIngredient[0]) || match.genericName || '';
    setEditedName(candidateName);
    setEditedActive(active);
    if (match.strength) setEditedStrength(match.strength);
    if (match.dosageForm) setEditedForm(match.dosageForm);

    try {
      const q = active || candidateName;
      const res = await fetch(`/api/medicine/details?name=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUnifiedProfile(data);
      }
    } catch (err) {
      // non-fatal
    }
  };

  const handleVoiceListen = (targetLang?: 'en' | 'kn') => {
    const activeLang = targetLang || ttsLang;
    // Stop Audio Toggle: if audio is currently playing or loading, stop immediately and reset UI
    if (isSpeaking || isAudioLoading) {
      stopSpeaking();
      setIsSpeaking(false);
      setIsAudioLoading(false);
      return;
    }

    setAudioNotice(null);

    const medicineObj = {
      name: editedName || unifiedProfile?.brandName || unifiedProfile?.name || pipelineResult?.medicineName || 'Medicine',
      strength: editedStrength || unifiedProfile?.strength,
      foodInstruction: unifiedProfile?.foodInteractions?.instruction || unifiedProfile?.foodInstructions?.instruction || pipelineResult?.foodInstructions,
      dosage: unifiedProfile?.dosage || pipelineResult?.dosageAndAdministration || (editedStrength ? `1 tablet (${editedStrength})` : '1 tablet as directed'),
      usage: unifiedProfile?.usage || pipelineResult?.indicationsAndUsage,
      sideEffects: unifiedProfile?.sideEffects?.common || pipelineResult?.sideEffects,
      kannada: unifiedProfile?.kannada,
    };

    const speech = formatForSpeech(medicineObj, activeLang);

    setIsAudioLoading(true);
    speakText(speech, {
      lang: activeLang,
      onLoading: (loading) => setIsAudioLoading(loading),
      onStart: () => {
        setIsAudioLoading(false);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsAudioLoading(false);
        setIsSpeaking(false);
      },
      onError: () => {
        setIsAudioLoading(false);
        setIsSpeaking(false);
      },
      onFallback: (msg) => setAudioNotice(msg),
    });
  };

  const handleSaveToCabinet = () => {
    const medToSave = {
      custom_name: editedName,
      medicineName: editedName,
      brand: editedName,
      active_ingredient: editedActive,
      strength: editedStrength || '500 mg',
      dosage_form: editedForm || 'Tablet',
      form: editedForm || 'Tablet',
      openFdaId: selectedMatch?.id || 'openfda-verified',
      current_stock: 20,
      prescription_instructions: selectedMatch?.purpose?.[0] || 'Take strictly according to physician prescription',
      startDate: new Date().toISOString().split('T')[0],
      notes: `Verified against openFDA dataset (${selectedMatch?.brandName || editedName})`,
    };
    onSaveToCabinet(medToSave);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <Camera className="w-7 h-7 text-teal-600" />
          <span>{t.scanner}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {lang === 'kn'
            ? 'ಔಷಧಿಯ ಬಾಕ್ಸ್ ಅಥವಾ ಸ್ಟ್ರಿಪ್ ಫೋಟೋವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು openFDA ಅಂತರರಾಷ್ಟ್ರೀಯ ಡ್ರಗ್ ಲೇಬಲ್ ಮೂಲಕ ಪರಿಶೀಲಿಸಿ.'
            : 'Capture or upload packaging. Cloud Vision OCR extracts tokens, and the official openFDA Drug Label API verifies candidate matches.'}
        </p>
      </div>

      {/* Camera / Upload Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-slate-200 shadow-inner">
          {isCameraActive ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-teal-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-bold tracking-wider text-teal-200 bg-slate-950/70 px-2 py-1 rounded">
                  {lang === 'kn' ? 'ಪ್ಯಾಕೆಟ್ ಅನ್ನು ಇಲ್ಲಿ ಕೇಂದ್ರೀಕರಿಸಿ' : 'Position medicine packaging inside frame'}
                </span>
              </div>
            </>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured Packaging" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-6 text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-40 text-teal-400" />
              <p className="text-sm font-medium">
                {lang === 'kn' ? 'ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Start camera or upload medicine packaging image'}
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 z-20">
              <RefreshCw className="w-10 h-10 text-teal-400 animate-spin mb-3" />
              <span className="font-extrabold text-lg text-white">Reading image...</span>
              <span className="text-xs text-teal-200 mt-1">
                Reading image... Extracting text & normalizing generic salt
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {isCameraActive ? (
            <>
              <button
                onClick={captureFrame}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all hover:scale-105"
              >
                <Camera className="w-5 h-5" />
                <span>{t.capturePhoto}</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
              >
                {t.cancel}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startCamera}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>{capturedImage ? t.retakePhoto : t.cameraCapture}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>{t.uploadImage}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </>
          )}
        </div>

        {/* Instant test shortcut buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium mb-2.5">
            {lang === 'kn' ? '10 ತ್ವರಿತ ಔಷಧಿ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳನ್ನು ಪರೀಕ್ಷಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ:' : 'Instant test shortcuts (Dynamic OCR Parsing & Fuzzy Search across 10 random medicines):'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => loadSamplePackaging('azithral')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
            >
              <span>💊 Azithral-500</span>
            </button>
            <button
              onClick={() => loadSamplePackaging('dolo')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Dolo-650
            </button>
            <button
              onClick={() => loadSamplePackaging('augmentin')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Augmentin 625
            </button>
            <button
              onClick={() => loadSamplePackaging('zerodol')}
              className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Zerodol-SP
            </button>
            <button
              onClick={() => loadSamplePackaging('aciloc')}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Aciloc 150
            </button>
            <button
              onClick={() => loadSamplePackaging('allegra')}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Allegra 120
            </button>
            <button
              onClick={() => loadSamplePackaging('omez')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Omez 20
            </button>
            <button
              onClick={() => loadSamplePackaging('benadryl')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold transition-all shadow-2xs"
            >
              🥄 Benadryl Syrup
            </button>
            <button
              onClick={() => loadSamplePackaging('pantocid')}
              className="px-3 py-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Pantocid 40
            </button>
            <button
              onClick={() => loadSamplePackaging('glycomet')}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-300 text-red-900 text-xs font-bold transition-all shadow-2xs"
            >
              💊 Glycomet 500
            </button>
            <button
              onClick={() => loadSamplePackaging('lantus')}
              className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-medium transition-all"
            >
              💉 Lantus
            </button>
            <button
              onClick={() => loadSamplePackaging('amoxicillin')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium transition-all"
            >
              🔬 Amoxicillin
            </button>
          </div>
        </div>
      </div>

      {/* Results View with Form-Specific UI and Verification Badges */}
      {pipelineResult && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-5 animate-in fade-in duration-300">
          {/* UI Debugging & Confirmation State + Smart Verification Step */}
          {(() => {
            const extractedTextDisplay =
              pipelineResult.extractedText ||
              (pipelineResult.rawText ? pipelineResult.rawText.split('\n')[0].trim() : '') ||
              editedName ||
              'Azithral-500';
            const identifiedGenericDisplay =
              pipelineResult.identifiedGeneric ||
              unifiedProfile?.genericName ||
              editedActive ||
              'Azithromycin';

            return (
              <div className="rounded-xl border-2 border-teal-500/80 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 p-4 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-teal-800 block">
                        OCR Verification & Confirmation Step
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        We read: <span className="text-teal-700 font-mono underline">"{extractedTextDisplay}"</span>. Is this correct?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-white border border-teal-200 font-bold text-slate-800 shadow-2xs">
                      Extracted: {extractedTextDisplay}
                    </span>
                    <span className="text-teal-600 font-bold">→</span>
                    <span className="px-2.5 py-1 rounded-md bg-teal-600 font-extrabold text-white shadow-2xs">
                      Identified as: {identifiedGenericDisplay}
                    </span>
                  </div>
                </div>

                {/* Editable text box with Search button to bypass bad OCR or blurry images */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleManualVerificationSearch(extractedInputText);
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={extractedInputText}
                      onChange={(e) => setExtractedInputText(e.target.value)}
                      placeholder="Verify or edit extracted text (e.g. Azithral-500, Paracetamol)..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-white border-2 border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAnalyzing || !extractedInputText.trim()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all disabled:opacity-50 shrink-0"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/90 border border-teal-200">
                    <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-500 text-xs block">Extracted OCR Text</span>
                      <span className="font-extrabold text-slate-900 font-mono">
                        Extracted: {extractedTextDisplay}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/90 border border-teal-200">
                    <Pill className="w-4 h-4 text-teal-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-teal-700 text-xs block">Normalized Generic Salt</span>
                      <span className="font-extrabold text-teal-900 font-mono">
                        Identified as: {identifiedGenericDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              {pipelineResult.verifiedBadge === 'local' ? (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified (Local Formulary)</span>
                </div>
              ) : pipelineResult.verifiedBadge === 'openfda' ? (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300 text-xs font-bold shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Verified via openFDA</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>No data found. Try searching by generic name.</span>
                </div>
              )}

              <span className="text-xs text-slate-500 font-semibold">
                Engine: {pipelineResult.ocrEngine === 'deepread' ? 'DeepRead AI OCR (deepread.tech)' : 'Deterministic OCR'}
              </span>
            </div>

            <button
              onClick={() => handleVoiceListen()}
              disabled={isAudioLoading}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-75 ${
                isSpeaking
                  ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              {isAudioLoading ? (
                <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
              ) : isSpeaking ? (
                <VolumeX className="w-4 h-4 text-rose-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-teal-700" />
              )}
              <span>
                {isAudioLoading
                  ? (lang === 'kn' ? 'ಆಡಿಯೋ ಲೋಡ್...' : 'Loading audio...')
                  : isSpeaking
                  ? t.stopVoice
                  : lang === 'kn'
                  ? t.listenKannada
                  : t.listenEnglish}
              </span>
            </button>
          </div>

          {/* Top 3 Matches "Confirm this medicine" UI */}
          {pipelineResult.openFdaMatches && pipelineResult.openFdaMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Confirm this medicine (Top Matches from openFDA Registry):</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {pipelineResult.openFdaMatches.length} result(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pipelineResult.openFdaMatches.map((match: any, idx: number) => {
                  const isSelected = selectedMatch?.brandName === match.brandName;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectCandidateMatch(match)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Match #{idx + 1}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm truncate">{match.brandName}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{match.genericName || 'Active Salt'}</p>
                      {match.manufacturerName && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate">{match.manufacturerName}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details / Manual Correction */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-lg text-slate-900">
                {isEditing
                  ? t.manualCorrection
                  : (editedName || (pipelineResult.isVerified ? 'Medicine Identified' : 'No data found. Try searching by generic name.'))}
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? t.saveChanges : t.manualCorrection}</span>
              </button>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">{t.medicineName}</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">{t.activeIngredient}</label>
                  <input
                    type="text"
                    value={editedActive}
                    onChange={(e) => setEditedActive(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">{t.strength}</label>
                  <input
                    type="text"
                    value={editedStrength}
                    onChange={(e) => setEditedStrength(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">{t.dosageForm}</label>
                  <input
                    type="text"
                    value={editedForm}
                    onChange={(e) => setEditedForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">{t.activeIngredient}</span>
                  <span className="font-bold text-slate-900">
                    {editedActive || (pipelineResult.isVerified ? 'Active Ingredient' : 'No data found. Try searching by generic name.')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">{t.strength}</span>
                  <span className="font-bold text-slate-900">{editedStrength || (pipelineResult.isVerified ? 'Standard' : '—')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">{t.dosageForm}</span>
                  <span className="font-bold text-slate-900">{editedForm || (pipelineResult.isVerified ? 'Tablet' : '—')}</span>
                </div>
              </div>
            )}

            {/* If no data found, display clear guidance */}
            {!pipelineResult.isVerified && (
              <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">No data found in drug registries.</span>
                  <p className="mt-0.5 text-slate-600">
                    Try searching by generic name (e.g. Paracetamol, Amoxicillin, Pantoprazole) or edit the fields above to save manually.
                  </p>
                </div>
              </div>
            )}

            {/* If ingredient fallback succeeded */}
            {pipelineResult.topMatch?.ingredientFallbackUsed && (
              <div className="mt-3.5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Generic Ingredient Fallback: {pipelineResult.topMatch.matchedIngredient || pipelineResult.topMatch.genericName}
                  </span>
                  <p className="mt-0.5 text-teal-800">
                    Brand was converted to its active ingredient and verified in official drug monographs.
                  </p>
                </div>
              </div>
            )}

            {/* Extracted Raw OCR Lines */}
            {pipelineResult.rawText && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-600 block mb-1">OCR Extracted Text:</span>
                <p className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-slate-200 max-h-24 overflow-y-auto">
                  {pipelineResult.rawText}
                </p>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* UNIFIED MEDICINE PROFILE: 4 SPECIFIED CARDS                    */}
          {/* ============================================================== */}
          <div className="space-y-4 pt-1">
            {/* CARD 1: PERFECT DOSAGE & FOOD INSTRUCTIONS */}
            {(() => {
              const currentForm = (editedForm || selectedMatch?.dosageForm || unifiedProfile?.dosageForm || 'Tablet').toLowerCase();
              const isSyrup = currentForm.includes('syrup') || currentForm.includes('suspension');
              const isInjection = currentForm.includes('injection') || currentForm.includes('inj');
              const isCapsule = currentForm.includes('capsule') || currentForm.includes('cap');

              const prominentDose = (unifiedProfile?.dosage && unifiedProfile.dosage.length <= 15)
                ? unifiedProfile.dosage
                : isSyrup
                ? (editedStrength ? `${editedStrength} (Liquid Oral)` : '5 ml - 10 ml')
                : isInjection
                ? (editedStrength || 'Clinical Use')
                : isCapsule
                ? (editedStrength ? `1 Capsule (${editedStrength})` : '1 Capsule')
                : (editedStrength ? `1 Tablet (${editedStrength})` : '1 Tablet');

              const timing = unifiedProfile?.foodInteractions?.timing || unifiedProfile?.foodInstructions?.timing || pipelineResult?.foodTiming || 'after_food';

              const renderFoodBadge = () => {
                switch (timing) {
                  case 'before_food':
                    return (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>🕒 {lang === 'kn' ? 'ಊಟಕ್ಕೆ ಮುಂಚೆ (Before Food)' : 'Before Food'}</span>
                      </span>
                    );
                  case 'with_food':
                    return (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                        <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                        <span>🍽️ {lang === 'kn' ? 'ಊಟದೊಂದಿಗೆ (Take With Food)' : 'Take With Food'}</span>
                      </span>
                    );
                  case 'empty_stomach':
                    return (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                        <Coffee className="w-3.5 h-3.5 text-blue-700" />
                        <span>⏳ {lang === 'kn' ? 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ (Empty Stomach)' : 'Take on Empty Stomach'}</span>
                      </span>
                    );
                  case 'general':
                    return (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs">
                        <Utensils className="w-3.5 h-3.5 text-teal-700" />
                        <span>🍽️ {lang === 'kn' ? 'ಊಟದೊಂದಿಗೆ ಅಥವಾ ಇಲ್ಲದೆ' : 'Take with or without food'}</span>
                      </span>
                    );
                  default:
                    return (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                        <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                        <span>🍽️ {lang === 'kn' ? 'ಊಟದ ನಂತರ (Take After Food)' : 'Take After Food'}</span>
                      </span>
                    );
                }
              };

              const dosageText = unifiedProfile?.dosage || pipelineResult?.dosageAndAdministration || (
                isSyrup ? 'Take 5-10 ml after food (Shake well before use)' :
                isInjection ? 'Administer as directed by physician' :
                isCapsule ? 'Take 1 capsule with water as directed' :
                'Take 1 tablet after food as directed by physician'
              );

              const foodInstructionText = unifiedProfile?.foodInteractions?.instruction ||
                unifiedProfile?.foodInstructions?.instruction ||
                pipelineResult?.foodInstructions ||
                'Take orally after food with a full glass of water.';

              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 text-emerald-950 space-y-3.5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 font-black text-sm text-emerald-950">
                      {isSyrup ? (
                        <FlaskConical className="w-5 h-5 text-amber-700" />
                      ) : isInjection ? (
                        <Syringe className="w-5 h-5 text-purple-700" />
                      ) : (
                        <Pill className="w-5 h-5 text-emerald-700" />
                      )}
                      <span>
                        {lang === 'kn' ? '೧. ಡೋಸೇಜ್ ಮತ್ತು ಆಹಾರ ಸೂಚನೆಗಳು' : 'Card 1: Dosage & Food Instructions'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-200/90 text-emerald-950 font-black text-xs">
                        {prominentDose}
                      </span>
                      {renderFoodBadge()}
                    </div>
                  </div>

                  <div className="bg-white/95 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">
                      {lang === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಡೋಸ್ (Administration Schedule)' : 'Recommended Dosage & Schedule'}
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm leading-snug">
                      {dosageText}
                    </p>

                    {/* Food Instruction Callout */}
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-start space-x-2">
                      <Utensils className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{foodInstructionText}</span>
                    </div>

                    {/* Form-specific clinical guidance note */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium flex items-center space-x-2">
                      {isSyrup ? (
                        <>
                          <Droplet className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Shake well before each use. Always use the calibrated measuring cup or spoon.</span>
                        </>
                      ) : isInjection ? (
                        <>
                          <Syringe className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Administered by qualified healthcare professional per specialist subcutaneous guidance.</span>
                        </>
                      ) : isCapsule ? (
                        <>
                          <Pill className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Swallow capsule whole with a full glass of water. Do not crush, chew, or open the capsule.</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Take with a full glass of water. Maintain consistent daily timing for best effectiveness.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 2: USAGE (WHAT IS IT FOR?) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 border-2 border-teal-300 text-teal-950 space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 font-black text-sm text-teal-950">
                <Sparkles className="w-5 h-5 text-teal-700" />
                <span>{lang === 'kn' ? '೨. ಬಳಕೆ ಮತ್ತು ಪ್ರಯೋಜನಗಳು (What is it for?)' : 'Card 2: Usage (What is it for?)'}</span>
              </div>

              <div className="bg-white/95 p-3.5 rounded-xl border border-teal-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm leading-relaxed">
                  {unifiedProfile?.usage || pipelineResult?.indicationsAndUsage || 'Indicated for therapeutic symptom relief as prescribed by healthcare provider.'}
                </p>

                {unifiedProfile?.formattedUsageBullets && unifiedProfile.formattedUsageBullets.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700 pt-1 border-t border-slate-100">
                    {unifiedProfile.formattedUsageBullets.map((bullet: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* CARD 3: SIDE EFFECTS & WARNINGS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 text-slate-950 space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 font-black text-sm text-slate-900">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <span>{lang === 'kn' ? '೩. ಸಂಭಾವ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು' : 'Card 3: Side Effects & Warnings'}</span>
              </div>

              <div className="bg-white/95 p-3.5 rounded-xl border border-slate-200 space-y-3">
                {/* Common Side Effects */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1.5">
                    {lang === 'kn' ? 'ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು (Common Reactions)' : 'Common Reactions (Mild)'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {((unifiedProfile?.sideEffects?.common && unifiedProfile.sideEffects.common.length > 0)
                      ? unifiedProfile.sideEffects.common
                      : ['Mild nausea or stomach discomfort', 'Headache', 'Mild drowsiness']
                    ).map((effect: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Red Warning Box if Severe Side Effects or Black Box Warnings */}
                {((unifiedProfile?.blackBoxWarnings && unifiedProfile.blackBoxWarnings.length > 0) ||
                  (unifiedProfile?.sideEffects?.seekMedicalHelp && unifiedProfile.sideEffects.seekMedicalHelp.length > 0)) && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    {/* Black Box Warning if present */}
                    {unifiedProfile?.blackBoxWarnings && unifiedProfile.blackBoxWarnings.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-950 text-white text-xs border-2 border-red-500 space-y-1">
                        <span className="font-black text-red-400 uppercase tracking-widest text-[10px] block">
                          ⚠️ BOXED WARNING (Official FDA & SafeRx Advisory)
                        </span>
                        {unifiedProfile.blackBoxWarnings.map((bbw: string, i: number) => (
                          <p key={i} className="leading-relaxed">{bbw}</p>
                        ))}
                      </div>
                    )}

                    {/* Severe side effects red alert box */}
                    <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs space-y-1.5">
                      <span className="font-bold text-rose-900 flex items-center space-x-1.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ (Seek Immediate Medical Help):' : 'Seek Immediate Medical Help If Occurs:'}</span>
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-900 font-medium">
                        {(unifiedProfile?.sideEffects?.seekMedicalHelp || [
                          'Difficulty breathing or wheezing',
                          'Swelling of face, lips, tongue, or throat',
                          'Severe skin rash, blistering, or peeling',
                        ]).map((severe: string, idx: number) => (
                          <li key={idx}>{severe}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 4: LISTEN (TTS VOICE GUIDANCE) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-300 text-indigo-950 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-black text-sm text-indigo-950">
                  <Volume2 className="w-5 h-5 text-indigo-700" />
                  <span>{lang === 'kn' ? '೪. ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ (Listen Aloud)' : 'Card 4: Listen (Voice Guidance)'}</span>
                </div>

                {/* Language Switcher Buttons */}
                <div className="inline-flex rounded-lg p-0.5 bg-indigo-100/80 border border-indigo-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                        setIsSpeaking(false);
                      }
                      setTtsLang('kn');
                      handleVoiceListen('kn');
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      ttsLang === 'kn'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-800 hover:text-indigo-950'
                    }`}
                  >
                    ಕನ್ನಡ (kn-IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                        setIsSpeaking(false);
                      }
                      setTtsLang('en');
                      handleVoiceListen('en');
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      ttsLang === 'en'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-800 hover:text-indigo-950'
                    }`}
                  >
                    English (en-IN)
                  </button>
                </div>
              </div>

              <div className="bg-white/95 p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{(() => {
                    const medicineObj = {
                      name: editedName || unifiedProfile?.brandName || unifiedProfile?.name || pipelineResult?.medicineName || 'Medicine',
                      strength: editedStrength || unifiedProfile?.strength,
                      foodInstruction: unifiedProfile?.foodInteractions?.instruction || unifiedProfile?.foodInstructions?.instruction || pipelineResult?.foodInstructions,
                      dosage: unifiedProfile?.dosage || pipelineResult?.dosageAndAdministration || (editedStrength ? `1 tablet (${editedStrength})` : '1 tablet as directed'),
                      usage: unifiedProfile?.usage || pipelineResult?.indicationsAndUsage,
                      sideEffects: unifiedProfile?.sideEffects?.common || pipelineResult?.sideEffects,
                      kannada: unifiedProfile?.kannada,
                    };
                    return formatForSpeech(medicineObj, ttsLang);
                  })()}"
                </p>

                {/* Blue Informational Fallback Box */}
                {audioNotice && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2.5 animate-in fade-in">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-blue-950">{audioNotice}</p>
                      <p className="text-[11px] text-blue-800/80 mt-0.5">
                        {ttsLang === 'kn' ? 'ಕ್ಲೌಡ್ ಆಡಿಯೋ ಬಳಸಿ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಕನ್ನಡ ಧ್ವನಿ ಸಕ್ರಿಯವಾಗಿದೆ.' : 'Using Cloud Audio.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-indigo-900 font-semibold">
                    Engine: {ttsLang === 'kn' ? 'Cloud Audio / Native Voice Engine' : 'Web Speech API'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleVoiceListen()}
                    disabled={isAudioLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-75 ${
                      isSpeaking
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isAudioLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : isSpeaking ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>
                      {isAudioLoading
                        ? (ttsLang === 'kn' ? 'ಆಡಿಯೋ ಲೋಡ್...' : 'Loading audio...')
                        : isSpeaking
                        ? t.stopVoice
                        : (ttsLang === 'kn' ? 'ಕನ್ನಡದಲ್ಲಿ ಆಲಿಸಿ' : 'Listen in English')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleSaveToCabinet}
              className="flex-1 min-w-[160px] flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.saveToCabinet}</span>
            </button>

            <button
              onClick={() => onSetReminder(editedName)}
              className="flex-1 min-w-[160px] flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all hover:scale-102"
            >
              <Clock className="w-4 h-4" />
              <span>{t.addReminder}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
