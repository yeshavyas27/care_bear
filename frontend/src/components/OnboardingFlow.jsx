import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bearIcon from '../../assets/bear.png';

const OnboardingFlow = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phone: '',
    },
    medicalHistory: {
      allergies: '',
      chronicConditions: '',
      pastSurgeries: '',
      currentMedications: '',
    },
    healthStatus: {
      currentConditions: '',
      symptoms: '',
      isPregnant: '',
      dueDate: '',
    },
    familyHistory: {
      heartDisease: false,
      diabetes: false,
      cancer: false,
      mentalHealth: false,
      other: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  const steps = [
    { title: 'Personal Information', key: 'personalInfo' },
    { title: 'Medical History', key: 'medicalHistory' },
    { title: 'Current Health', key: 'healthStatus' },
    { title: 'Family History', key: 'familyHistory' },
    { title: 'Emergency Contact', key: 'emergencyContact' },
  ];

  const updateFormData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
            First Name *
          </label>
          <input
            type="text"
            value={formData.personalInfo.firstName}
            onChange={(e) => updateFormData('personalInfo', 'firstName', e.target.value)}
            className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.personalInfo.lastName}
            onChange={(e) => updateFormData('personalInfo', 'lastName', e.target.value)}
            className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.personalInfo.dateOfBirth}
            onChange={(e) => updateFormData('personalInfo', 'dateOfBirth', e.target.value)}
            className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
            Gender *
          </label>
          <select
            value={formData.personalInfo.gender}
            onChange={(e) => updateFormData('personalInfo', 'gender', e.target.value)}
            className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Email Address *
        </label>
        <input
          type="email"
          value={formData.personalInfo.email}
          onChange={(e) => updateFormData('personalInfo', 'email', e.target.value)}
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.personalInfo.phone}
          onChange={(e) => updateFormData('personalInfo', 'phone', e.target.value)}
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
          required
        />
      </div>
    </div>
  );

  const renderMedicalHistory = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Known Allergies
        </label>
        <textarea
          value={formData.medicalHistory.allergies}
          onChange={(e) => updateFormData('medicalHistory', 'allergies', e.target.value)}
          placeholder="e.g., Penicillin, Peanuts, Latex..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Chronic Conditions
        </label>
        <textarea
          value={formData.medicalHistory.chronicConditions}
          onChange={(e) => updateFormData('medicalHistory', 'chronicConditions', e.target.value)}
          placeholder="e.g., Diabetes, Hypertension, Asthma..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Past Surgeries
        </label>
        <textarea
          value={formData.medicalHistory.pastSurgeries}
          onChange={(e) => updateFormData('medicalHistory', 'pastSurgeries', e.target.value)}
          placeholder="List any previous surgeries and dates..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Current Medications
        </label>
        <textarea
          value={formData.medicalHistory.currentMedications}
          onChange={(e) => updateFormData('medicalHistory', 'currentMedications', e.target.value)}
          placeholder="List all current medications, dosages, and frequency..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>
    </div>
  );

  const renderHealthStatus = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Current Health Conditions
        </label>
        <textarea
          value={formData.healthStatus.currentConditions}
          onChange={(e) => updateFormData('healthStatus', 'currentConditions', e.target.value)}
          placeholder="Describe any current health issues or concerns..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Current Symptoms
        </label>
        <textarea
          value={formData.healthStatus.symptoms}
          onChange={(e) => updateFormData('healthStatus', 'symptoms', e.target.value)}
          placeholder="List any symptoms you're currently experiencing..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Are you currently pregnant?
        </label>
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="isPregnant"
              value="yes"
              checked={formData.healthStatus.isPregnant === 'yes'}
              onChange={(e) => updateFormData('healthStatus', 'isPregnant', e.target.value)}
              className="w-5 h-5 text-brown border-charcoal/20 focus:ring-brown"
            />
            <span className="ml-2 text-charcoal">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="isPregnant"
              value="no"
              checked={formData.healthStatus.isPregnant === 'no'}
              onChange={(e) => updateFormData('healthStatus', 'isPregnant', e.target.value)}
              className="w-5 h-5 text-brown border-charcoal/20 focus:ring-brown"
            />
            <span className="ml-2 text-charcoal">No</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="isPregnant"
              value="n/a"
              checked={formData.healthStatus.isPregnant === 'n/a'}
              onChange={(e) => updateFormData('healthStatus', 'isPregnant', e.target.value)}
              className="w-5 h-5 text-brown border-charcoal/20 focus:ring-brown"
            />
            <span className="ml-2 text-charcoal">N/A</span>
          </label>
        </div>
      </div>

      {formData.healthStatus.isPregnant === 'yes' && (
        <div>
          <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
            Expected Due Date
          </label>
          <input
            type="date"
            value={formData.healthStatus.dueDate}
            onChange={(e) => updateFormData('healthStatus', 'dueDate', e.target.value)}
            className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
          />
        </div>
      )}
    </div>
  );

  const renderFamilyHistory = () => (
    <div className="space-y-6">
      <p className="text-charcoal/70 text-sm">
        Please indicate if any immediate family members have had the following conditions:
      </p>

      <div className="space-y-4">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.familyHistory.heartDisease}
            onChange={(e) => updateFormData('familyHistory', 'heartDisease', e.target.checked)}
            className="w-5 h-5 text-brown border-charcoal/20 rounded focus:ring-brown"
          />
          <span className="ml-3 text-charcoal group-hover:text-brown transition-colors">
            Heart Disease
          </span>
        </label>

        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.familyHistory.diabetes}
            onChange={(e) => updateFormData('familyHistory', 'diabetes', e.target.checked)}
            className="w-5 h-5 text-brown border-charcoal/20 rounded focus:ring-brown"
          />
          <span className="ml-3 text-charcoal group-hover:text-brown transition-colors">
            Diabetes
          </span>
        </label>

        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.familyHistory.cancer}
            onChange={(e) => updateFormData('familyHistory', 'cancer', e.target.checked)}
            className="w-5 h-5 text-brown border-charcoal/20 rounded focus:ring-brown"
          />
          <span className="ml-3 text-charcoal group-hover:text-brown transition-colors">
            Cancer
          </span>
        </label>

        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.familyHistory.mentalHealth}
            onChange={(e) => updateFormData('familyHistory', 'mentalHealth', e.target.checked)}
            className="w-5 h-5 text-brown border-charcoal/20 rounded focus:ring-brown"
          />
          <span className="ml-3 text-charcoal group-hover:text-brown transition-colors">
            Mental Health Conditions
          </span>
        </label>
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Other Family Health History
        </label>
        <textarea
          value={formData.familyHistory.other}
          onChange={(e) => updateFormData('familyHistory', 'other', e.target.value)}
          placeholder="Any other relevant family medical history..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white h-24 resize-none"
        />
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Emergency Contact Name *
        </label>
        <input
          type="text"
          value={formData.emergencyContact.name}
          onChange={(e) => updateFormData('emergencyContact', 'name', e.target.value)}
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Relationship *
        </label>
        <input
          type="text"
          value={formData.emergencyContact.relationship}
          onChange={(e) => updateFormData('emergencyContact', 'relationship', e.target.value)}
          placeholder="e.g., Spouse, Parent, Sibling..."
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-charcoal font-medium mb-2 text-sm tracking-wide">
          Emergency Contact Phone *
        </label>
        <input
          type="tel"
          value={formData.emergencyContact.phone}
          onChange={(e) => updateFormData('emergencyContact', 'phone', e.target.value)}
          className="w-full px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none transition-colors bg-white"
          required
        />
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderMedicalHistory();
      case 2:
        return renderHealthStatus();
      case 3:
        return renderFamilyHistory();
      case 4:
        return renderEmergencyContact();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-0">
            <img src={bearIcon} alt="MediPal" className="w-20 h-20 rounded-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold text-charcoal mb-3 -mt-4">
            Welcome to MediPal
          </h1>
          <p className="text-charcoal/70 text-lg">
            Let's get to know you better so I can take care of you
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`text-xs font-medium ${
                  index === currentStep
                    ? 'text-brown'
                    : index < currentStep
                    ? 'text-charcoal'
                    : 'text-charcoal/40'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="h-2 bg-charcoal/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brown transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-charcoal/10 p-8 mb-6">
          <h2 className="text-2xl font-bold text-charcoal mb-6">
            {steps[currentStep].title}
          </h2>
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'bg-charcoal/10 text-charcoal/40 cursor-not-allowed'
                : 'bg-white border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-brown text-white rounded-xl font-medium hover:bg-brown/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
