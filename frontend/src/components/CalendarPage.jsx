import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicationAPI, calendarAPI } from '../services/api';

const CalendarPage = ({ userData }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [medications, setMedications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'Daily',
  });

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, currentDate]);

  const loadData = async () => {
    try {
      // Fetch medications and calendar view in parallel
      const [medsResponse, viewResponse] = await Promise.all([
        medicationAPI.getAll(userId, true),
        calendarAPI.getView(userId, currentDate.getMonth() + 1, currentDate.getFullYear())
      ]);

      // Map backend medication data to frontend structure
      const loadedMeds = medsResponse.data.map(med => ({
        id: med.medication_id,
        name: med.name,
        dosage: med.dosage,
        time: med.time,
        frequency: med.frequency,
        taken: {} // Will be populated from viewResponse
      }));

      // Populate taken status from calendar view
      if (viewResponse.data && viewResponse.data.days) {
        viewResponse.data.days.forEach(dayData => {
          const day = new Date(dayData.date).getDate();
          
          // medications_taken is an array of medication_ids that were taken on this date
          if (dayData.medications_taken && dayData.medications_taken.length > 0) {
            dayData.medications_taken.forEach(medId => {
              const med = loadedMeds.find(m => m.id === medId);
              if (med) {
                med.taken[day] = true;
              }
            });
          }
        });
      }

      setMedications(loadedMeds);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleMedicationTaken = async (medId, day) => {
    // Find current state
    const med = medications.find(m => m.id === medId);
    const wasTaken = med?.taken[day] || false;
    
    // Optimistic UI update
    setMedications(prev =>
      prev.map(m =>
        m.id === medId
          ? {
              ...m,
              taken: {
                ...m.taken,
                [day]: !wasTaken,
              },
            }
          : m
      )
    );

    try {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      // Format as YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      
      // Backend expects: { user_id, medication_id, date, taken, time_taken }
      await medicationAPI.track({
        user_id: userId,
        medication_id: medId,
        date: dateStr,
        taken: !wasTaken,
        time_taken: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking medication:', error);
      loadData(); // Revert on error
    }
  };

  const addMedication = async () => {
    if (newMedication.name && newMedication.dosage && newMedication.time) {
      try {
        // Backend expects: { user_id, name, dosage, time, frequency }
        await medicationAPI.create({
          user_id: userId,
          name: newMedication.name,
          dosage: newMedication.dosage,
          time: newMedication.time,
          frequency: newMedication.frequency
        });
        
        setNewMedication({ name: '', dosage: '', time: '', frequency: 'Daily' });
        setShowAddModal(false);
        loadData(); // Refresh list
      } catch (error) {
        console.error('Error adding medication:', error);
      }
    }
  };

  const getTodaysMedications = () => {
    const today = new Date().getDate();
    return medications.map(med => ({
      ...med,
      isTaken: med.taken[today] || false,
    }));
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b-2 border-charcoal/10 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-cream rounded-xl transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-xl font-bold text-charcoal">Medication Calendar</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brown text-white rounded-xl font-medium hover:bg-brown/90 transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Medication
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Medications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
              <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Today's Schedule
              </h2>
              <div className="space-y-3">
                {getTodaysMedications().map((med) => (
                  <div
                    key={med.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      med.isTaken
                        ? 'bg-brown/10 border-brown'
                        : 'bg-cream/50 border-charcoal/10 hover:border-brown/50'
                    }`}
                    onClick={() => toggleMedicationTaken(med.id, new Date().getDate())}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-charcoal mb-1">{med.name}</h3>
                        <p className="text-sm text-charcoal/70">{med.dosage}</p>
                        <p className="text-sm text-charcoal/70 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {med.time}
                          </span>
                        </p>
                      </div>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        med.isTaken ? 'bg-brown border-brown' : 'border-charcoal/30'
                      }`}>
                        {med.isTaken && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {getTodaysMedications().length === 0 && (
                  <p className="text-charcoal/50 text-sm text-center py-4">
                    No medications scheduled for today
                  </p>
                )}
              </div>
            </div>

            {/* All Medications List */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6 mt-6">
              <h2 className="text-xl font-bold text-charcoal mb-4">All Medications</h2>
              <div className="space-y-2">
                {medications.map((med) => (
                  <div key={med.id} className="p-3 bg-cream/50 rounded-lg">
                    <h3 className="font-semibold text-charcoal text-sm">{med.name}</h3>
                    <p className="text-xs text-charcoal/70">{med.dosage} • {med.time}</p>
                    <p className="text-xs text-charcoal/50 mt-1">{med.frequency}</p>
                  </div>
                ))}
                {medications.length === 0 && (
                  <p className="text-charcoal/50 text-sm text-center py-4">
                    No medications added yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-charcoal">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-cream rounded-lg transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-cream rounded-lg transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-charcoal/70 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();
                  
                  const completedCount = medications.filter(med => med.taken[day]).length;
                  const totalCount = medications.length;
                  const allCompleted = completedCount === totalCount && totalCount > 0;
                  const someCompleted = completedCount > 0 && completedCount < totalCount;

                  return (
                    <div
                      key={day}
                      className={`aspect-square p-2 rounded-xl border-2 transition-all ${
                        isToday
                          ? 'border-brown bg-brown/10'
                          : allCompleted
                          ? 'border-brown/30 bg-brown/5'
                          : someCompleted
                          ? 'border-brown/20 bg-brown/5'
                          : 'border-charcoal/10 hover:border-charcoal/30'
                      }`}
                    >
                      <div className="h-full flex flex-col">
                        <span className={`text-sm font-semibold ${
                          isToday ? 'text-brown' : 'text-charcoal'
                        }`}>
                          {day}
                        </span>
                        {totalCount > 0 && (
                          <div className="mt-auto flex gap-0.5 flex-wrap">
                            {medications.slice(0, 3).map((med) => (
                              <div
                                key={med.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  med.taken[day] ? 'bg-brown' : 'bg-charcoal/20'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-6 text-sm text-charcoal/70">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brown" />
                  <span>Taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-charcoal/20" />
                  <span>Not taken</span>
                </div>
              </div>
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
    </div>
  );
};

export default CalendarPage;