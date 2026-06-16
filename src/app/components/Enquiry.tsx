import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "./shared";

export function EnquiryPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [requirement, setRequirement] = useState("Harvester");
  const [dateNeeded, setDateNeeded] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: finalPhone, location, requirement, dateNeeded }),
      });

      if (res.ok) {
        toast.success("Enquiry submitted successfully! We will contact you soon.");
        setTimeout(() => navigate("/"), 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit enquiry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button 
          onClick={() => navigate("/")} 
          className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263]"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            Submit an Enquiry
          </h1>
          <p className="text-[#57585A]">Looking for Harvesters or Operators? Let us know your requirements.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] p-8 space-y-5 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">Full Name *</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" 
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">Phone Number *</label>
            <input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
              type="tel"
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" 
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">Location *</label>
            <input 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              required 
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" 
              placeholder="Enter your city/district"
            />
          </div>

          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">Requirement *</label>
            <select
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
            >
              <option value="Harvester">Harvester</option>
              <option value="Operator">Operator</option>
              <option value="Both">Both (Harvester & Operator)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">Date Needed *</label>
            <input 
              value={dateNeeded} 
              onChange={(e) => setDateNeeded(e.target.value)} 
              required 
              type="date"
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" 
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4" 
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Submit Enquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
