import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import bearIcon from '../../assets/bear.png';

// Voice-First Discharge Companion Homepage
const HomePage = ({ userData }) => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en-US');
  const [fhirSummary, setFhirSummary] = useState(null);
  const [followUps, setFollowUps] = useState(() => JSON.parse(localStorage.getItem('cb_followUps') || '[]'));
  const [symptoms, setSymptoms] = useState(() => JSON.parse(localStorage.getItem('cb_symptoms') || '[]'));
  const [medLog, setMedLog] = useState(() => JSON.parse(localStorage.getItem('cb_medLog') || '[]'));
  const [question, setQuestion] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState(() => JSON.parse(localStorage.getItem('cb_recordings') || '[]'));
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    localStorage.setItem('cb_symptoms', JSON.stringify(symptoms));
  }, [symptoms]);

  useEffect(() => {
    localStorage.setItem('cb_medLog', JSON.stringify(medLog));
  }, [medLog]);

  useEffect(() => {
    localStorage.setItem('cb_recordings', JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem('cb_followUps', JSON.stringify(followUps));
  }, [followUps]);

  const nextAppointment = useMemo(() => {
    if (!Array.isArray(followUps) || followUps.length === 0) return null;
    const future = followUps
      .map((f) => ({ ...f, time: f.when ? new Date(f.when).getTime() : NaN }))
      .filter((f) => !isNaN(f.time) && f.time > Date.now())
      .sort((a, b) => a.time - b.time);
    return future.length ? future[0] : null;
  }, [followUps]);

  const speakNextAppointment = () => {
    if (!nextAppointment) {
      const t = new SpeechSynthesisUtterance('You have no upcoming appointments scheduled.');
      t.lang = language;
      window.speechSynthesis.speak(t);
      return;
    }
    const whenText = new Date(nextAppointment.when).toLocaleString();
    const text = `Your next appointment is ${nextAppointment.title} on ${whenText}.`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    window.speechSynthesis.speak(utter);
  };

  const handleFHIRUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // For now just store the raw file text as a placeholder
      setFhirSummary({ name: file.name, content: ev.target.result });
    };
    reader.readAsText(file);
  };

  const handleGenerateVoiceSummary = () => {
    // Placeholder: use SpeechSynthesis to simulate ElevenLabs output
    const text = fhirSummary
      ? `Hi ${userData?.personalInfo?.firstName || 'there'}. I read your discharge summary titled ${fhirSummary.name}. Tonight the main thing is to take your blue pill. If you have questions, ask me.`
      : `Hi ${userData?.personalInfo?.firstName || 'there'}. I don't have your discharge summary yet. You can upload it or connect Dedalus.`;

    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } else {
      alert('Speech synthesis not available in this browser.');
    }
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    // Placeholder reasoning: in production call K2 Think + Dedalus to reason on FHIR
    const answer = fhirSummary
      ? `Based on your discharge summary, it's generally safe, but double-check with your provider. (Example answer to "${question}")`
      : `I don't have your discharge data yet. Upload it so I can give a tailored answer to "${question}".`;
    // speak the answer to keep voice-first
    const utter = new SpeechSynthesisUtterance(answer);
    utter.lang = language;
    window.speechSynthesis.speak(utter);
    setQuestion('');
  };

  const addSymptom = (text) => {
    const s = { id: Date.now(), text, timestamp: new Date().toISOString() };
    setSymptoms((prev) => [s, ...prev]);
  };

  const toggleMedTaken = (medName) => {
    const entry = { id: Date.now(), medName, timestamp: new Date().toISOString() };
    setMedLog((prev) => [entry, ...prev]);
  };

  // Recording handlers (simple MediaRecorder wrapper)
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Recording not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const rec = { id: Date.now(), url, createdAt: new Date().toISOString() };
        setRecordings((prev) => [rec, ...prev]);
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Could not start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const connectDedalusPlaceholder = () => {
    // Placeholder to simulate connecting to Dedalus for FHIR import
    alert('Dedalus integration is a placeholder. Provide API keys to enable real connection.');
  };

  const handleChatNavigation = () => {
    setIsTransitioning(true);
    setTimeout(() => navigate('/chat'), 300);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Transition Overlay */}
      <div
        className={`fixed inset-0 bg-cream pointer-events-none transition-opacity duration-300 ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Header */}
      <div className="bg-white border-b-2 border-charcoal/10 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="50" height="50" viewBox="0 0 100 100" className="flex-shrink-0">
              <circle cx="50" cy="50" r="45" fill="#CD853F" stroke="#654321" strokeWidth="3"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold text-charcoal">Voice-First Discharge Companion</h1>
              <p className="text-xs text-charcoal/60">A friendly, voice-first translator for your discharge plan</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2 border-2 border-charcoal/20 rounded-lg bg-white">
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="zh-CN">中文</option>
            </select>
            <button onClick={() => navigate('/chat')} className="px-4 py-2 bg-brown text-white rounded-xl font-medium text-sm">Chat</button>
            <button onClick={() => navigate('/profile')} className="px-4 py-2 border-2 border-charcoal text-charcoal rounded-xl font-medium text-sm">Profile</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
            <h2 className="text-lg font-bold mb-2">Import Discharge Summary</h2>
            <p className="text-sm text-charcoal/70 mb-4">Upload a FHIR discharge summary (or connect Dedalus) so the companion can reason about your meds and follow-ups.</p>
            <input type="file" accept=".json,.xml,.txt" onChange={handleFHIRUpload} className="mb-3" />
            <div className="flex gap-2">
              <button onClick={connectDedalusPlaceholder} className="px-4 py-2 bg-brown text-white rounded-xl text-sm">Connect Dedalus</button>
              <button onClick={handleGenerateVoiceSummary} className="px-4 py-2 border-2 border-charcoal rounded-xl text-sm">Generate Voice Summary</button>
            </div>
            {fhirSummary && (
              <div className="mt-3 text-xs text-charcoal/60">Loaded: {fhirSummary.name}</div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
            <h2 className="text-lg font-bold mb-2">Ask the Companion</h2>
            <p className="text-sm text-charcoal/70 mb-3">Ask targeted questions — the agent will reason over your discharge data and respond in plain language.</p>
            <div className="flex gap-2 mb-2">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Can I eat grapefruit?" className="flex-1 px-3 py-2 border-2 border-charcoal/20 rounded-lg" />
              <button onClick={handleAskQuestion} className="px-4 py-2 bg-brown text-white rounded-xl">Ask</button>
            </div>
            <small className="text-xs text-charcoal/50">Tip: The agent may ask follow-ups to clarify intent without exposing complex clinical reasoning.</small>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
            <h2 className="text-lg font-bold mb-2">Medication & Dosing</h2>
            <p className="text-sm text-charcoal/70 mb-3">Quickly log when you take a medication or record yourself while taking it.</p>
            <div className="space-y-2">
              <button onClick={() => toggleMedTaken('Blue Pill')} className="px-3 py-2 bg-brown text-white rounded-xl text-sm">I took Blue Pill</button>
              <div className="flex gap-2 items-center">
                <button onClick={isRecording ? stopRecording : startRecording} className={`px-3 py-2 rounded-xl text-sm ${isRecording ? 'bg-charcoal/10 text-charcoal' : 'bg-brown text-white'}`}>
                  {isRecording ? 'Stop Recording' : 'Record While Taking Med'}
                </button>
                <small className="text-xs text-charcoal/60">Save an audio note for carers or future visits</small>
              </div>
            </div>
          </div>
        </div>

        {/* Symptom Tracker & Follow-ups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
            <h2 className="text-lg font-bold mb-3">Symptom Tracker</h2>
            <SymptomInput onAdd={addSymptom} />
            <ul className="mt-3 space-y-2">
              {symptoms.map(s => (
                <li key={s.id} className="text-sm text-charcoal/70">{new Date(s.timestamp).toLocaleString()}: {s.text}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
            <h2 className="text-lg font-bold mb-3">Follow-ups & Appointments</h2>
            <p className="text-sm text-charcoal/70 mb-3">Track upcoming follow-ups and get voice reminders.</p>
            <div className="flex gap-2 mb-3">
              <input id="followTitle" placeholder="Title (e.g., Cardiology)" className="flex-1 px-3 py-2 border-2 border-charcoal/20 rounded-lg" />
              <input id="followWhen" type="datetime-local" className="px-3 py-2 border-2 border-charcoal/20 rounded-lg" />
              <button onClick={() => {
                const titleEl = document.getElementById('followTitle');
                const whenEl = document.getElementById('followWhen');
                const title = titleEl?.value?.trim();
                const when = whenEl?.value;
                if (!title || !when) {
                  alert('Please provide both a title and a date/time for the appointment.');
                  return;
                }
                const item = { id: Date.now(), title, when };
                setFollowUps((p) => [item, ...p]);
                titleEl.value = '';
                whenEl.value = '';
              }} className="px-3 py-2 bg-brown text-white rounded-xl text-sm">Add</button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-charcoal/70">Upcoming appointments: {followUps.length}</div>
              <div>
                <button onClick={speakNextAppointment} className="px-3 py-2 border-2 border-charcoal rounded-lg text-sm mr-2">Speak Next</button>
                {nextAppointment && (
                  <span className="text-sm text-charcoal/60">Next: {nextAppointment.title} — {new Date(nextAppointment.when).toLocaleString()}</span>
                )}
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {followUps.map(f => (
                <li key={f.id} className="text-sm text-charcoal/70">{f.title} — {f.when}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recordings & History */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
          <h2 className="text-lg font-bold mb-3">Recordings & History</h2>
          <p className="text-sm text-charcoal/70 mb-3">Audio notes and medication logs are stored locally. For privacy, these never leave your device unless you choose to share them.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Audio Notes</h3>
              <ul className="space-y-2">
                {recordings.map(r => (
                  <li key={r.id} className="flex items-center gap-2">
                    <audio src={r.url} controls className="w-full" />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Medication Log</h3>
              <ul className="space-y-2 text-sm text-charcoal/70">
                {medLog.map(m => (
                  <li key={m.id}>{new Date(m.timestamp).toLocaleString()} — {m.medName}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Discharge Summary</h3>
              <pre className="text-xs text-charcoal/60 max-h-36 overflow-auto bg-cream/50 p-2 rounded">{fhirSummary ? String(fhirSummary.content).slice(0, 1000) + (String(fhirSummary.content).length > 1000 ? '…' : '') : 'No summary loaded'}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bear Button with Speech Bubble */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
        {/* Speech Bubble */}
        <div className="bg-white border-2 border-charcoal/10 rounded-2xl shadow-lg px-4 py-3 max-w-xs animate-bounce">
          <p className="text-sm text-charcoal font-medium">Need help? Let's chat about your care plan!</p>
          <div className="absolute bottom-0 right-8 w-0 h-0 border-l-8 border-r-0 border-t-8 border-l-transparent border-t-white border-t-opacity-0"></div>
        </div>

        {/* Bear Button */}
        <button
          onClick={handleChatNavigation}
          className="w-16 h-16 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200 flex items-center justify-center group relative overflow-hidden animate-bounce"
          title="Chat with Care Bear"
        >
          <img src={bearIcon} alt="Care Bear" className="w-16 h-16 object-cover rounded-full" />
        </button>
      </div>
    </div>
  );
};

const SymptomInput = ({ onAdd }) => {
  const [val, setVal] = useState('');
  return (
    <div>
      <div className="flex gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Describe a symptom (e.g., increased pain)" className="flex-1 px-3 py-2 border-2 border-charcoal/20 rounded-lg" />
        <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }} className="px-3 py-2 bg-brown text-white rounded-xl">Add</button>
      </div>
      <div className="text-xs text-charcoal/50 mt-2">The companion can prompt follow-ups and suggest when to contact a provider.</div>
    </div>
  );
};

export default HomePage;
