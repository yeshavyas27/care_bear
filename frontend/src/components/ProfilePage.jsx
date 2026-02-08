import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, healthAPI } from '../services/api';

const ProfilePage = ({ userData, updateUserData, chatHistory }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(userData);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setError('');
      const userId = localStorage.getItem('userId');
      
      // Map frontend structure to backend expected structure
      const apiData = {
        personal_info: {
          first_name: editedData.personalInfo.firstName,
          last_name: editedData.personalInfo.lastName,
          date_of_birth: editedData.personalInfo.dateOfBirth,
          gender: editedData.personalInfo.gender,
          email: editedData.personalInfo.email,
          phone: editedData.personalInfo.phone,
        },
        medical_history: {
          allergies: editedData.medicalHistory.allergies,
          chronic_conditions: editedData.medicalHistory.chronicConditions,
          past_surgeries: editedData.medicalHistory.pastSurgeries,
          current_medications: editedData.medicalHistory.currentMedications,
        },
        health_status: {
          current_conditions: editedData.healthStatus.currentConditions,
          symptoms: editedData.healthStatus.symptoms,
          is_pregnant: editedData.healthStatus.isPregnant,
          due_date: editedData.healthStatus.dueDate,
        },
        family_history: {
          heart_disease: editedData.familyHistory.heartDisease,
          diabetes: editedData.familyHistory.diabetes,
          cancer: editedData.familyHistory.cancer,
          mental_health: editedData.familyHistory.mentalHealth,
          other: editedData.familyHistory.other,
        },
        emergency_contact: {
          name: editedData.emergencyContact.name,
          relationship: editedData.emergencyContact.relationship,
          phone: editedData.emergencyContact.phone,
        },
      };
      
      await userAPI.update(userId, apiData);
      updateUserData(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.response?.data?.detail || 'Failed to save changes. Please try again.');
    }
  };

  const generateReport = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      // Get current date for end_date
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      
      // Get date 30 days ago for start_date
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Trigger report generation on backend
      // Backend expects: { user_id, start_date, end_date }
      const response = await healthAPI.generateReport(userId, startDateStr, endDate);
      const reportData = response.data;
      
      // Build report content from backend response
      const reportContent = `
CARE BEAR HEALTH REPORT
Generated: ${new Date().toLocaleString()}

========================================
PATIENT INFORMATION
========================================
Name: ${reportData.user_info?.personal_info?.first_name || userData.personalInfo.firstName} ${reportData.user_info?.personal_info?.last_name || userData.personalInfo.lastName}
Date of Birth: ${reportData.user_info?.personal_info?.date_of_birth || userData.personalInfo.dateOfBirth}
Gender: ${reportData.user_info?.personal_info?.gender || userData.personalInfo.gender}
Email: ${reportData.user_info?.personal_info?.email || userData.personalInfo.email}
Phone: ${reportData.user_info?.personal_info?.phone || userData.personalInfo.phone}

========================================
MEDICAL HISTORY
========================================
Known Allergies: ${reportData.user_info?.medical_history?.allergies || userData.medicalHistory.allergies || 'None reported'}
Chronic Conditions: ${reportData.user_info?.medical_history?.chronic_conditions || userData.medicalHistory.chronicConditions || 'None reported'}
Past Surgeries: ${reportData.user_info?.medical_history?.past_surgeries || userData.medicalHistory.pastSurgeries || 'None reported'}
Current Medications: ${reportData.user_info?.medical_history?.current_medications || userData.medicalHistory.currentMedications || 'None reported'}

========================================
CURRENT HEALTH STATUS
========================================
Current Conditions: ${reportData.user_info?.health_status?.current_conditions || userData.healthStatus.currentConditions || 'None reported'}
Current Symptoms: ${reportData.user_info?.health_status?.symptoms || userData.healthStatus.symptoms || 'None reported'}
${reportData.user_info?.health_status?.is_pregnant === 'yes' ? `Pregnancy Status: Yes\nDue Date: ${reportData.user_info.health_status.due_date || 'Not specified'}` : ''}

========================================
FAMILY MEDICAL HISTORY
========================================
Heart Disease: ${userData.familyHistory.heartDisease ? 'Yes' : 'No'}
Diabetes: ${userData.familyHistory.diabetes ? 'Yes' : 'No'}
Cancer: ${userData.familyHistory.cancer ? 'Yes' : 'No'}
Mental Health: ${userData.familyHistory.mentalHealth ? 'Yes' : 'No'}
Other: ${userData.familyHistory.other || 'None reported'}

========================================
EMERGENCY CONTACT
========================================
Name: ${userData.emergencyContact.name}
Relationship: ${userData.emergencyContact.relationship}
Phone: ${userData.emergencyContact.phone}

========================================
CURRENT MEDICATIONS
========================================
${reportData.medications && reportData.medications.length > 0 
  ? reportData.medications.map((med, idx) => 
      `${idx + 1}. ${med.name} - ${med.dosage} at ${med.time} (${med.frequency})`
    ).join('\n')
  : 'No active medications'}

========================================
RECENT MOOD TRACKING (Last 30 Days)
========================================
${reportData.recent_moods && reportData.recent_moods.length > 0
  ? reportData.recent_moods.slice(0, 10).map((mood, idx) => 
      `${idx + 1}. [${new Date(mood.date).toLocaleDateString()}] Mood: ${mood.mood}${mood.notes ? ' - ' + mood.notes : ''}`
    ).join('\n')
  : 'No mood entries recorded'}

========================================
ACTIVE HEALTH CONDITIONS
========================================
${reportData.active_conditions && reportData.active_conditions.length > 0
  ? reportData.active_conditions.map((cond, idx) => 
      `${idx + 1}. ${cond.condition_name} (Recorded: ${new Date(cond.recorded_date).toLocaleDateString()})${cond.notes ? '\n   Notes: ' + cond.notes : ''}`
    ).join('\n')
  : 'No active health conditions'}

========================================
CHAT INTERACTION SUMMARY
========================================
${reportData.chat_summary ? `
Total Conversations: ${reportData.chat_summary.total_conversations || 0}
Date Range: ${reportData.chat_summary.date_range || 'N/A'}
Recent Topics Discussed: ${reportData.chat_summary.recent_topics && reportData.chat_summary.recent_topics.length > 0 
  ? reportData.chat_summary.recent_topics.join(', ') 
  : 'No specific topics identified'}
` : 'No chat history available'}

========================================
END OF REPORT
========================================

This report has been generated for medical consultation purposes.
Please share this with your healthcare provider.
    `;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CareBear_HealthReport_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert(error.response?.data?.detail || 'Could not generate report. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b-2 border-charcoal/10 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-cream rounded-xl transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-xl font-bold text-charcoal">Your Profile</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-brown text-white rounded-xl font-medium hover:bg-brown/90 transition-all shadow-md hover:shadow-lg text-sm"
            >
              Generate Report
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border-2 border-charcoal text-charcoal rounded-xl font-medium hover:bg-charcoal hover:text-white transition-all text-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditedData(userData);
                    setIsEditing(false);
                    setError('');
                  }}
                  className="px-4 py-2 border-2 border-charcoal/30 text-charcoal/70 rounded-xl font-medium hover:bg-charcoal/10 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-brown text-white rounded-xl font-medium hover:bg-brown/90 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
          <h2 className="text-2xl font-bold text-charcoal mb-6 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="First Name"
              value={isEditing ? editedData.personalInfo.firstName : userData.personalInfo.firstName}
              isEditing={isEditing}
              onChange={(val) => setEditedData({
                ...editedData,
                personalInfo: { ...editedData.personalInfo, firstName: val }
              })}
            />
            <InfoField
              label="Last Name"
              value={isEditing ? editedData.personalInfo.lastName : userData.personalInfo.lastName}
              isEditing={isEditing}
              onChange={(val) => setEditedData({
                ...editedData,
                personalInfo: { ...editedData.personalInfo, lastName: val }
              })}
            />
            <InfoField
              label="Date of Birth"
              value={isEditing ? editedData.personalInfo.dateOfBirth : userData.personalInfo.dateOfBirth}
              isEditing={isEditing}
              type="date"
              onChange={(val) => setEditedData({
                ...editedData,
                personalInfo: { ...editedData.personalInfo, dateOfBirth: val }
              })}
            />
            <InfoField
              label="Gender"
              value={isEditing ? editedData.personalInfo.gender : userData.personalInfo.gender}
              isEditing={isEditing}
              onChange={(val) => setEditedData({
                ...editedData,
                personalInfo: { ...editedData.personalInfo, gender: val }
              })}
            />
            <InfoField
              label="Email"
              value={isEditing ? editedData.personalInfo.email : userData.personalInfo.email}
              isEditing={isEditing}
              type="email"
              onChange={(val) => setEditedData({
                ...editedData,
                personalInfo: { ...editedData.personalInfo, email: val }
              })}
            />
            <InfoField
              label="Phone"
              value={isEditing ? editedData.personalInfo.phone : userData.personalInfo.phone}
              isEditing={isEditing}
              type="tel"
              onChange={(val) => setEditedData({
                ...editedData,
                personalInfo: { ...editedData.personalInfo, phone: val }
              })}
            />
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
          <h2 className="text-2xl font-bold text-charcoal mb-6 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Medical History
          </h2>
          <div className="space-y-4">
            <InfoField
              label="Known Allergies"
              value={isEditing ? editedData.medicalHistory.allergies : userData.medicalHistory.allergies}
              isEditing={isEditing}
              multiline
              onChange={(val) => setEditedData({
                ...editedData,
                medicalHistory: { ...editedData.medicalHistory, allergies: val }
              })}
            />
            <InfoField
              label="Chronic Conditions"
              value={isEditing ? editedData.medicalHistory.chronicConditions : userData.medicalHistory.chronicConditions}
              isEditing={isEditing}
              multiline
              onChange={(val) => setEditedData({
                ...editedData,
                medicalHistory: { ...editedData.medicalHistory, chronicConditions: val }
              })}
            />
            <InfoField
              label="Past Surgeries"
              value={isEditing ? editedData.medicalHistory.pastSurgeries : userData.medicalHistory.pastSurgeries}
              isEditing={isEditing}
              multiline
              onChange={(val) => setEditedData({
                ...editedData,
                medicalHistory: { ...editedData.medicalHistory, pastSurgeries: val }
              })}
            />
            <InfoField
              label="Current Medications"
              value={isEditing ? editedData.medicalHistory.currentMedications : userData.medicalHistory.currentMedications}
              isEditing={isEditing}
              multiline
              onChange={(val) => setEditedData({
                ...editedData,
                medicalHistory: { ...editedData.medicalHistory, currentMedications: val }
              })}
            />
          </div>
        </div>

        {/* Current Health Status */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
          <h2 className="text-2xl font-bold text-charcoal mb-6 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Current Health Status
          </h2>
          <div className="space-y-4">
            <InfoField
              label="Current Conditions"
              value={isEditing ? editedData.healthStatus.currentConditions : userData.healthStatus.currentConditions}
              isEditing={isEditing}
              multiline
              onChange={(val) => setEditedData({
                ...editedData,
                healthStatus: { ...editedData.healthStatus, currentConditions: val }
              })}
            />
            <InfoField
              label="Current Symptoms"
              value={isEditing ? editedData.healthStatus.symptoms : userData.healthStatus.symptoms}
              isEditing={isEditing}
              multiline
              onChange={(val) => setEditedData({
                ...editedData,
                healthStatus: { ...editedData.healthStatus, symptoms: val }
              })}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-charcoal/10 p-6">
          <h2 className="text-2xl font-bold text-charcoal mb-6 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField
              label="Name"
              value={isEditing ? editedData.emergencyContact.name : userData.emergencyContact.name}
              isEditing={isEditing}
              onChange={(val) => setEditedData({
                ...editedData,
                emergencyContact: { ...editedData.emergencyContact, name: val }
              })}
            />
            <InfoField
              label="Relationship"
              value={isEditing ? editedData.emergencyContact.relationship : userData.emergencyContact.relationship}
              isEditing={isEditing}
              onChange={(val) => setEditedData({
                ...editedData,
                emergencyContact: { ...editedData.emergencyContact, relationship: val }
              })}
            />
            <InfoField
              label="Phone"
              value={isEditing ? editedData.emergencyContact.phone : userData.emergencyContact.phone}
              isEditing={isEditing}
              type="tel"
              onChange={(val) => setEditedData({
                ...editedData,
                emergencyContact: { ...editedData.emergencyContact, phone: val }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoField = ({ label, value, isEditing, onChange, type = 'text', multiline = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal/70 mb-1">
        {label}
      </label>
      {isEditing ? (
        multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-charcoal/20 rounded-lg focus:border-brown focus:outline-none transition-colors bg-white resize-none"
            rows="3"
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-charcoal/20 rounded-lg focus:border-brown focus:outline-none transition-colors bg-white"
          />
        )
      ) : (
        <p className="px-3 py-2 bg-cream/50 rounded-lg text-charcoal min-h-[2.5rem] flex items-center">
          {value || <span className="text-charcoal/40">Not provided</span>}
        </p>
      )}
    </div>
  );
};

export default ProfilePage;