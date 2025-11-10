import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, Download, Loader2, AlertCircle, Building2, Users, Mail, Phone, User, Briefcase } from 'lucide-react';

const NamecardAgent = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [step, setStep] = useState('upload');
  const [extractedData, setExtractedData] = useState(null);
  const [enrichedData, setEnrichedData] = useState(null);
  const [successRate, setSuccessRate] = useState(0);
  const [error, setError] = useState(null);

  // Real OCR extraction using Claude API
  const extractNamecardData = async (base64Image, mimeType) => {
    setProcessing(true);
    setStep('extracting');
    setError(null);
    
    try {
      const response = await fetch("/.netlify/functions/claude-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: base64Image,
                  }
                },
                {
                  type: "text",
                  text: `Extract the following information from this namecard image and respond ONLY with valid JSON in this exact format:

{
  "name": "extracted full name or null",
  "company": "extracted company name or null",
  "jobTitle": "extracted job title or null",
  "phone": "extracted phone number or null",
  "email": "extracted email address or null"
}

CRITICAL: Your response must be ONLY the JSON object, nothing else. No explanation, no markdown, no backticks.`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up response
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const extracted = JSON.parse(responseText);
      
      setExtractedData(extracted);
      setProcessing(false);
      setStep('extracted');
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Failed to extract data from namecard. Please try again.");
      setProcessing(false);
      setStep('upload');
    }
  };

  // Real LLM-based data enrichment
  const enrichData = async () => {
    setEnriching(true);
    setStep('enriching');
    setError(null);
    
    try {
      const response = await fetch("/.netlify/functions/claude-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Based on this contact information, enrich the data by identifying the industry and estimating company size:

Name: ${extractedData.name || 'N/A'}
Company: ${extractedData.company || 'N/A'}
Job Title: ${extractedData.jobTitle || 'N/A'}

Respond ONLY with valid JSON in this exact format:
{
  "industry": "identified industry sector",
  "companySize": "estimated size range (e.g., '1-50', '51-200', '201-500', '500+')",
  "confidence": {
    "industry": 0.85,
    "companySize": 0.75
  }
}

Base your estimates on:
- Company name patterns (Pte Ltd suggests Singapore SME, Corp/Inc suggests larger)
- Job title seniority
- Industry indicators in company name
- Known company information if available

CRITICAL: Respond with ONLY the JSON object, no explanation, no markdown, no backticks.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up response
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const enrichmentResult = JSON.parse(responseText);
      
      const enriched = {
        ...extractedData,
        industry: enrichmentResult.industry,
        companySize: enrichmentResult.companySize,
        confidence: enrichmentResult.confidence
      };
      
      // Calculate success rate
      const fields = ['name', 'company', 'jobTitle', 'phone', 'email', 'industry', 'companySize'];
      const filledFields = fields.filter(field => enriched[field] && enriched[field] !== null).length;
      const rate = Math.round((filledFields / fields.length) * 100);
      
      setEnrichedData(enriched);
      setSuccessRate(rate);
      setEnriching(false);
      setStep('enriched');
    } catch (err) {
      console.error("Enrichment error:", err);
      setError("Failed to enrich data. Please try again.");
      setEnriching(false);
      setStep('extracted');
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG, PNG, or WEBP)');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type;
        
        setUploadedImage(dataUrl);
        setImageBase64(base64);
        extractNamecardData(base64, mimeType);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save to database (simulated - in production would call your backend API)
  const saveToDatabase = async () => {
    setStep('saving');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, you would call your backend API here:
    // await fetch('/api/contacts', {
    //   method: 'POST',
    //   body: JSON.stringify(enrichedData)
    // });
    
    setStep('saved');
  };

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    const data = enrichedData || extractedData;
    const csvContent = `Name,Company Name,Job Title,Phone Number,Email,Industry,Company Size
"${data.name || 'N/A'}","${data.company || 'N/A'}","${data.jobTitle || 'N/A'}","${data.phone || 'N/A'}","${data.email || 'N/A'}","${data.industry || 'N/A'}","${data.companySize || 'N/A'}"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namecard_${(data.name || 'contact').replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Reset demo
  const resetDemo = () => {
    setUploadedImage(null);
    setImageBase64(null);
    setExtractedData(null);
    setEnrichedData(null);
    setStep('upload');
    setSuccessRate(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Intelligent Namecard Agent</h1>
          </div>
          <p className="text-gray-600 text-lg">Upload namecard → Extract data → Enrich with AI → Save to database</p>
          <p className="text-sm text-green-600 font-medium mt-2">✓ Real OCR & AI Processing</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-900">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {['Upload', 'Extract', 'Enrich', 'Save'].map((label, idx) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  idx === 0 && step !== 'upload' ? 'bg-green-100 text-green-700' :
                  idx === 1 && ['extracted', 'enriching', 'enriched', 'saving', 'saved'].includes(step) ? 'bg-green-100 text-green-700' :
                  idx === 2 && ['enriched', 'saving', 'saved'].includes(step) ? 'bg-green-100 text-green-700' :
                  idx === 3 && step === 'saved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {idx === 0 && step !== 'upload' && <CheckCircle className="w-4 h-4" />}
                  {idx === 1 && ['extracted', 'enriching', 'enriched', 'saving', 'saved'].includes(step) && <CheckCircle className="w-4 h-4" />}
                  {idx === 2 && ['enriched', 'saving', 'saved'].includes(step) && <CheckCircle className="w-4 h-4" />}
                  {idx === 3 && step === 'saved' && <CheckCircle className="w-4 h-4" />}
                  <span className="font-medium">{label}</span>
                </div>
                {idx < 3 && <div className="w-8 h-0.5 bg-gray-300"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Namecard Image
              </h2>
              
              {!uploadedImage ? (
                <label className="border-4 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <span className="text-gray-600 font-medium mb-2">Click to upload namecard</span>
                  <span className="text-gray-400 text-sm">PNG, JPG, WEBP up to 5MB</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded namecard" 
                    className="w-full rounded-lg border-2 border-gray-200"
                  />
                  {step === 'extracting' && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing namecard with AI...</span>
                    </div>
                  )}
                  {step !== 'upload' && step !== 'extracting' && (
                    <button
                      onClick={resetDemo}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      Upload Different Card
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Success Rate Card */}
            {step === 'enriched' && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Data Enrichment Success</h3>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold">{successRate}%</div>
                  <div className="flex-1">
                    <div className="bg-white/30 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-white h-full transition-all duration-1000"
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-2 text-green-50">
                      {successRate === 100 ? 'All fields successfully extracted and enriched' : `${successRate}% of fields completed`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Extracted Data */}
          <div className="space-y-6">
            {(extractedData || enrichedData) && (
              <>
                {/* Extracted Data Card */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Extracted Information
                  </h2>
                  
                  <div className="space-y-3">
                    <DataField 
                      icon={<User className="w-4 h-4" />}
                      label="Name" 
                      value={extractedData.name}
                      status="extracted"
                    />
                    <DataField 
                      icon={<Building2 className="w-4 h-4" />}
                      label="Company Name" 
                      value={extractedData.company}
                      status="extracted"
                    />
                    <DataField 
                      icon={<Briefcase className="w-4 h-4" />}
                      label="Job Title" 
                      value={extractedData.jobTitle}
                      status="extracted"
                    />
                    <DataField 
                      icon={<Phone className="w-4 h-4" />}
                      label="Phone Number" 
                      value={extractedData.phone}
                      status="extracted"
                    />
                    <DataField 
                      icon={<Mail className="w-4 h-4" />}
                      label="Email" 
                      value={extractedData.email}
                      status="extracted"
                    />
                  </div>
                </div>

                {/* Missing Data Card */}
                {step === 'extracted' && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-amber-900 mb-1">Missing Information Detected</h3>
                        <p className="text-sm text-amber-700">The following fields need enrichment:</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-amber-800">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Industry</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-800">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Company Size</span>
                      </div>
                    </div>
                    <button
                      onClick={enrichData}
                      disabled={enriching}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-5 h-5" />
                      Enrich Data with AI
                    </button>
                  </div>
                )}

                {/* Enriching Status */}
                {step === 'enriching' && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Enriching Data...</h3>
                        <p className="text-sm text-blue-700">Using AI to analyze company information</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-blue-800">✓ Analyzing company profile</div>
                      <div className="text-sm text-blue-800">✓ Identifying industry sector</div>
                      <div className="text-sm text-blue-800">✓ Estimating company size</div>
                    </div>
                  </div>
                )}

                {/* Enriched Data Card */}
                {enrichedData && step !== 'enriching' && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Enriched Information
                    </h2>
                    
                    <div className="space-y-3 mb-6">
                      <DataField 
                        icon={<Building2 className="w-4 h-4" />}
                        label="Industry" 
                        value={enrichedData.industry}
                        status="enriched"
                        confidence={enrichedData.confidence?.industry}
                      />
                      <DataField 
                        icon={<Users className="w-4 h-4" />}
                        label="Company Size" 
                        value={enrichedData.companySize}
                        status="enriched"
                        confidence={enrichedData.confidence?.companySize}
                      />
                    </div>

                    {step === 'enriched' && (
                      <div className="space-y-3">
                        <button
                          onClick={saveToDatabase}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Save to Database
                        </button>
                        <button
                          onClick={exportToExcel}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Export to Excel (CSV)
                        </button>
                      </div>
                    )}

                    {step === 'saving' && (
                      <div className="flex items-center justify-center gap-2 text-green-600 py-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving to database...</span>
                      </div>
                    )}

                    {step === 'saved' && (
                      <div className="space-y-3">
                        <div className="bg-green-100 border border-green-300 rounded-lg p-4 flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <div className="font-semibold text-green-900">Successfully Saved!</div>
                            <div className="text-sm text-green-700">Contact information stored in database</div>
                          </div>
                        </div>
                        <button
                          onClick={resetDemo}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                          Process Another Namecard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Powered by Claude AI • Real OCR extraction and intelligent data enrichment</p>
        </div>
      </div>
    </div>
  );
};

// Data Field Component
const DataField = ({ icon, label, value, status, confidence }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
    <div className={`mt-1 ${status === 'enriched' ? 'text-green-600' : 'text-blue-600'}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className="text-sm text-gray-900 font-medium break-words">
        {value || <span className="text-gray-400 italic">Not found</span>}
      </div>
      {confidence && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all"
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{Math.round(confidence * 100)}%</span>
        </div>
      )}
    </div>
    {status === 'enriched' && (
      <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
        AI Enriched
      </div>
    )}
  </div>
);

export default NamecardAgent;
