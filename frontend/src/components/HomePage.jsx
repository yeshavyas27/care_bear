import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import bearIcon from '../../assets/bear.png';

// MediPal Homepage
const HomePage = ({ userData, medications, updateMedications }) => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en-US');
  const [fhirSummary, setFhirSummary] = useState(null);
  const [followUps, setFollowUps] = useState(() => JSON.parse(localStorage.getItem('cb_followUps') || '[]'));
  const [symptoms, setSymptoms] = useState(() => JSON.parse(localStorage.getItem('cb_symptoms') || '[]'));
  const [medLog, setMedLog] = useState(() => JSON.parse(localStorage.getItem('cb_medLog') || '[]'));
  const [question, setQuestion] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Medication UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'Daily',
  });

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

  // Calendar helper data
  const getTodaysMedications = () => {
    const today = new Date().getDate();
    return medications.map(med => ({
      ...med,
      isTaken: med.taken[today] || false,
    }));
  };

  const getTomorrowsMedications = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.getDate();
    return medications.map(med => ({
      ...med,
      isTaken: med.taken[tomorrowDate] || false,
    }));
  };

  const toggleMedicationTaken = (medId, day) => {
    const updated = medications.map(med =>
      med.id === medId
        ? {
            ...med,
            taken: {
              ...med.taken,
              [day]: !med.taken[day],
            },
          }
        : med
    );
    
    // Check if all medications are now taken
    const allTaken = updated.every(med => med.taken[day]);
    if (allTaken && updated.length > 0) {
      setTimeout(() => setShowCompletionModal(true), 300);
    }
    
    updateMedications(updated);
  };

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.time) {
      updateMedications([
        ...medications,
        {
          id: Date.now(),
          ...newMedication,
          taken: {},
        },
      ]);
      setNewMedication({ name: '', dosage: '', time: '', frequency: 'Daily' });
      setShowAddModal(false);
    }
  };

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
            <img src={bearIcon} alt="MediPal" className="w-12 h-12 rounded-full flex-shrink-0 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-charcoal">MediPal</h1>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => navigate('/calendar')}
              className="p-3 hover:bg-cream rounded-xl transition-colors"
              title="Medication Calendar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            <button onClick={() => navigate('/chat')} className="px-4 py-2 bg-brown text-white rounded-xl font-medium text-sm">Chat</button>
            <button onClick={() => navigate('/profile')} className="px-4 py-2 border-2 border-charcoal text-charcoal rounded-xl font-medium text-sm">Profile</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome Section with Bear */}
        <div className="flex flex-col items-center gap-0 mb-6">
          <img src={bearIcon} alt="Care Bear" className="w-96 h-96 object-contain" style={{ mixBlendMode: 'darken' }} />
          <h2 className="text-6xl font-bold text-charcoal -mt-4">
            Hello {userData?.name || 'Friend'}!
          </h2>
        </div>

        {/* Medication Schedule */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-charcoal">Today's Medications</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-brown text-white rounded-xl font-medium hover:bg-brown/90 transition-all text-sm flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add
            </button>
          </div>

          {getTodaysMedications().length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {getTodaysMedications().map((med) => (
                  <div
                    key={med.id}
                    onClick={() => toggleMedicationTaken(med.id, new Date().getDate())}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      med.isTaken
                        ? 'bg-brown/10 border-brown'
                        : 'bg-cream hover:border-brown border-charcoal/10'
                    }`}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal">{med.name}</h3>
                      <p className="text-sm text-charcoal/70">{med.dosage} at {med.time}</p>
                    </div>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 ${
                      med.isTaken ? 'bg-brown border-brown' : 'border-charcoal/30'
                    }`}>
                      {med.isTaken && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-charcoal/10">
                <p className="text-sm text-charcoal/70 mb-2">
                  {getTodaysMedications().filter(m => m.isTaken).length} of {getTodaysMedications().length} taken
                </p>
                <div className="w-full bg-charcoal/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brown h-full transition-all"
                    style={{
                      width: `${(getTodaysMedications().filter(m => m.isTaken).length / getTodaysMedications().length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-charcoal/60 text-center py-8">No medications scheduled for today</p>
          )}
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

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-charcoal mb-6">Add New Medication</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors"
                  placeholder="e.g., Aspirin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors"
                  placeholder="e.g., 100mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={newMedication.time}
                  onChange={(e) => setNewMedication({ ...newMedication, time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Frequency
                </label>
                <select
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors"
                >
                  <option value="Daily">Daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="As needed">As needed</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border-2 border-charcoal/30 text-charcoal rounded-xl font-medium hover:bg-charcoal/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addMedication}
                className="flex-1 px-4 py-3 bg-brown text-white rounded-xl font-medium hover:bg-brown/90 transition-all shadow-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in">
            {/* Large Checkmark */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-brown/10 rounded-full flex items-center justify-center animate-bounce">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#CD853F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-charcoal mb-2">Great Job!</h2>
            <p className="text-lg text-charcoal/70 mb-6">You've completed all your medications for today!</p>
            
            <div className="bg-brown/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-charcoal/60">Keep up the great work with your medication routine!</p>
            </div>

            {/* Tomorrow's Sneak Peek */}
            <div className="mb-6 p-4 bg-cream rounded-xl border-2 border-charcoal/10">
              <p className="text-sm font-semibold text-charcoal mb-3">Tomorrow's Medications</p>
              <div className="space-y-2">
                {getTomorrowsMedications().map((med) => (
                  <div key={med.id} className="text-left text-sm">
                    <p className="font-medium text-charcoal">{med.name}</p>
                    <p className="text-xs text-charcoal/70">{med.dosage} at {med.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowCompletionModal(false)}
              className="w-full px-6 py-3 bg-brown text-white rounded-xl font-semibold hover:bg-brown/90 transition-all shadow-lg"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
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
