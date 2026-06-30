import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "./shared";
import { useTranslation } from "react-i18next";

export function AskQuestion() {
  const { t } = useTranslation(["pages", "common"]);
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error(t("askQuestion.errorEmpty", { defaultValue: "Please enter your question." }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        toast.success(t("askQuestion.successToast", { defaultValue: "Question submitted successfully! It will be listed under FAQs after admin review." }));
        setQuestion("");
        setTimeout(() => navigate("/"), 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || t("askQuestion.errorToast", { defaultValue: "Failed to submit question." }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("askQuestion.errorGeneric", { defaultValue: "Error submitting question." }));
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
          <ArrowLeft size={16} /> {t("askQuestion.backToHome", { defaultValue: "Back to Home" })}
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            {t("askQuestion.title", { defaultValue: "Ask a Question" })}
          </h1>
          <p className="text-[#57585A]">{t("askQuestion.subtitle", { defaultValue: "Have a question about Tractor Seva? Ask here, and our administrators will provide an answer." })}</p>
        </div>
 
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] p-8 space-y-5 shadow-[0_2px_16px_rgba(23,34,99,0.06)]">
          <div>
            <label className="text-sm text-[#57585A] block mb-2 font-semibold">{t("askQuestion.labelQuestion", { defaultValue: "Your Question *" })}</label>
            <textarea 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              required 
              rows={5}
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none" 
              placeholder={t("askQuestion.placeholderQuestion", { defaultValue: "Type your question here..." })}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4" 
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t("askQuestion.submit", { defaultValue: "Submit Question" })
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
