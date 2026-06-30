import React from "react";
import districtsData from "./districts.json";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export const INDIAN_STATES = districtsData.states.map(s => s.state);

export const MACHINE_TYPES = ["Combine Harvester", "Rice Harvester", "Wheat Harvester", "Maize Harvester", "Sugarcane Harvester", "Paddy Harvester"];
export const COMPANIES = ["John Deere", "Claas", "Mahindra", "New Holland", "AGCO", "Preet", "Sonalika", "Other"];

export const HARVESTER_MODELS: Record<string, string[]> = {
  "John Deere": [
    "S760", "S770", "S780", "S790",
    "S660", "S670", "S680", "S690",
    "X9 1000", "X9 1100",
    "T670",
    "W330", "W440"
  ],
  "Claas": [
    "Lexion 8800", "Lexion 8700", "Lexion 8600",
    "Lexion 7700", "Lexion 7600", "Lexion 7500",
    "Tucano 580", "Tucano 560", "Tucano 450",
    "Crop Tiger 30", "Crop Tiger 40"
  ],
  "Mahindra": [
    "Arjun 605 DI",
    "Novo 605 DI",
    "Swaraj Pro Combine 7060",
    "Swaraj Pro Combine 7090"
  ],
  "New Holland": [
    "CR10.90", "CR9.90",
    "TC5.30", "TC5.90",
    "CX8.80", "CX8.90"
  ],
  "AGCO": [
    "Massey Ferguson 9505",
    "Massey Ferguson MF 7300",
    "Fendt Ideal 9",
    "Fendt Ideal 8",
    "Fendt Ideal 7"
  ],
  "Preet": [
    "Preet 982",
    "Preet 949",
    "Preet 749",
    "Preet 849"
  ],
  "Sonalika": [
    "Harvester 9500",
    "Harvester 7500",
    "Sonalika 5125"
  ],
  "Kartar": [
    "Kartar 4000",
    "Kartar 3600",
    "Kartar 3500"
  ],
  "Dashmesh": [
    "Dashmesh 9100",
    "Dashmesh 912",
    "Dashmesh 7100"
  ],
  "Kubota": [
    "DC-68G", "DC-70G", "DC-93", "DC-105X"
  ],
  "Other": [
    "Other / Custom Model"
  ]
};

export const HARVESTER_COMPANIES = Object.keys(HARVESTER_MODELS);

// Helper to parse Markdown content and render styled JSX elements in blogs
export function renderMarkdown(content: string) {
  if (!content) return null;
  
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const parseInline = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    // We split by ** first for bold text
    const boldParts = text.split(/\*\*([^*]+)\*\*/g);
    return boldParts.flatMap((bPart, bIdx) => {
      if (bIdx % 2 === 1) {
        return [<strong key={`b-${bIdx}`} className="font-extrabold text-[#172263]">{bPart}</strong>];
      }
      // For non-bold parts, split by * or _ for italics
      const italicParts = bPart.split(/\*([^*]+)\*/g);
      return italicParts.flatMap((iPart, iIdx) => {
        if (iIdx % 2 === 1) {
          return [<em key={`i-${bIdx}-${iIdx}`} className="italic text-[#57585A] font-medium">{iPart}</em>];
        }
        // Also support _italic_ parsing
        const underParts = iPart.split(/_([^_]+)_/g);
        return underParts.map((uPart, uIdx) => {
          if (uIdx % 2 === 1) {
            return <em key={`u-${bIdx}-${iIdx}-${uIdx}`} className="italic text-[#57585A] font-medium">{uPart}</em>;
          }
          return uPart;
        });
      });
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Heading 1 (# Section)
    if (trimmed.startsWith('# ')) {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      const title = trimmed.replace(/^#\s+/, '');
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl md:text-2xl font-black text-[#172263] mt-8 mb-4 font-sora">
          {parseInline(title)}
        </h1>
      );
    }
    // Heading 2 (## Section)
    else if (trimmed.startsWith('## ')) {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      const title = trimmed.replace(/^##\s+/, '');
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg md:text-xl font-extrabold text-[#172263] mt-6 mb-3 font-sora">
          {parseInline(title)}
        </h2>
      );
    }
    // Heading 3 (### Sub-section)
    else if (trimmed.startsWith('### ')) {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      const title = trimmed.replace(/^###\s+/, '');
      elements.push(
        <h3 key={`h3-${index}`} className="text-base md:text-lg font-black text-[#D97706] mt-4 mb-2 font-sora">
          {parseInline(title)}
        </h3>
      );
    }
    // List item (- Item or * Item)
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      listItems.push(
        <li key={`li-${index}`} className="text-xs md:text-sm text-[#57585A] leading-relaxed">
          {parseInline(itemText)}
        </li>
      );
    }
    // Empty line
    else if (trimmed === '') {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
    }
    // Paragraph
    else {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      elements.push(
        <p key={`p-${index}`} className="text-xs md:text-sm text-[#57585A] leading-relaxed mb-3">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  if (inList) {
    elements.push(<ul key="list-final" className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
  }

  return <div className="space-y-3">{elements}</div>;
}

export const getStatusBadge = (status?: string) => {
  const currentStatus = status || "Pending";
  switch (currentStatus) {
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Approved
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold shadow-sm">
          <XCircle size={13} className="text-rose-600" />
          Rejected
        </span>
      );
    case "Pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm">
          <Clock size={13} className="text-amber-600 animate-pulse" />
          Pending Approval
        </span>
      );
  }
};

export const getUserVerificationStatusBadge = (status?: string) => {
  const currentStatus = status || "Pending";
  switch (currentStatus) {
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Verified
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold shadow-sm">
          <XCircle size={13} className="text-rose-600" />
          Unverified
        </span>
      );
    case "Pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm">
          <Clock size={13} className="text-amber-600 animate-pulse" />
          Pending
        </span>
      );
  }
};
