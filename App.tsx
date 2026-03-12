import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const STORAGE_KEY = "nuage-commusoft-importer-v2";

const INTERNAL_EXACT_NAMES = [
  "sian port",
  "kieran masterson",
  "sara carson",
  "nua admin",
];

const INTERNAL_PARTIAL_NAMES = [
  "nick",
  "gemma",
  "cablis",
  "hello",
  "nu age",
  "nuage",
];

const INTERNAL_EMAIL_HINTS = ["@nuageplumbing.com", "hello@"];
const INTERNAL_ADDRESS_HINTS = [
  "7a kingswood close",
  "coventry, cv6 4az",
  "cv6 4az",
];

function isInternalEmail(email: string) {
  const lower = email.toLowerCase().trim();
  if (!lower) return false;
  if (lower.includes("@nuageplumbing.com")) return true;
  return INTERNAL_EMAIL_HINTS.some((hint) => lower.includes(hint));
}

function isInternalName(name: string) {
  const lower = name.toLowerCase().trim();
  if (!lower) return false;
  if (INTERNAL_EXACT_NAMES.includes(lower)) return true;
  return INTERNAL_PARTIAL_NAMES.some((part) => lower.includes(part));
}

function isInternalAddress(address: string) {
  const lower = address.toLowerCase().trim();
  if (!lower) return false;
  return INTERNAL_ADDRESS_HINTS.some((hint) => lower.includes(hint));
}

function titleCase(text: string) {
  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function splitBlocks(text: string) {
  const cleaned = text.replace(/\r/g, "");
  const blocks = cleaned
    .split(/(?=^From:\s)|(?=^On .* wrote:)/gim)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.length ? blocks : [cleaned];
}

function extractBlockEmail(block: string) {
  const match = block.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return match ? match[0].trim() : "";
}

function extractBlockName(block: string) {
  const explicit = block.match(/^Name:\s*(.+)$/im);
  if (explicit && explicit[1]) return explicit[1].trim();

  const fromLine = block.match(/^From:\s*([^<\n]+?)(?:\s*<[^>]+>)?$/im);
  if (fromLine && fromLine[1])
    return fromLine[1].trim().replace(/^['"]|['"]$/g, "");

  const toLine = block.match(/^To:\s*([^<\n]+?)(?:\s*<[^>]+>)?$/im);
  if (toLine && toLine[1]) return toLine[1].trim().replace(/^['"]|['"]$/g, "");

  return "";
}

function extractExplicitAddress(block: string) {
  const explicit = block.match(/^Address:\s*(.+)$/im);
  return explicit ? explicit[1].trim() : "";
}

function extractAddressCandidates(text: string) {
  const candidates: string[] = [];

  const explicit = [...text.matchAll(/^Address:\s*(.+)$/gim)].map((m) =>
    m[1].trim()
  );
  candidates.push(...explicit);

  const lineMatches = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) =>
      /\d{1,4}[A-Za-z]?(?:\s+[A-Za-z0-9.'-]+){1,6}\s(?:Road|Rd|Street|St|Close|Avenue|Ave|Lane|Drive|Way|Court|Crescent|Place|Gardens|Green)\b/i.test(
        line
      )
    );

  candidates.push(...lineMatches);

  return [...new Set(candidates)]
    .filter((address) => !isInternalAddress(address))
    .filter((address) => !isInternalEmail(address));
}

function extractPhoneCandidates(text: string) {
  const matches = [
    ...text.matchAll(/(?:\+44\s?7\d{3}|0?7\d{3})[\s\-]?\d{3}[\s\-]?\d{3}/g),
  ].map((m) => m[0].trim());
  return [...new Set(matches)];
}

function chooseBestCustomerBlock(text: string) {
  const blocks = splitBlocks(text);

  for (const block of blocks) {
    const lower = block.toLowerCase();
    const email = extractBlockEmail(block);
    const name = extractBlockName(block);
    const address = extractExplicitAddress(block);

    const hasExternalEmail = email && !isInternalEmail(email);
    const hasExternalName = name && !isInternalName(name);
    const hasExternalAddress = address && !isInternalAddress(address);

    if (hasExternalEmail || hasExternalName || hasExternalAddress) {
      if (!INTERNAL_ADDRESS_HINTS.some((hint) => lower.includes(hint))) {
        return block;
      }
    }
  }

  return text;
}

function extractDetails(text: string) {
  const bestBlock = chooseBestCustomerBlock(text);

  const emailCandidates = [
    extractBlockEmail(bestBlock),
    ...[
      ...bestBlock.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi),
    ].map((m) => m[0].trim()),
  ]
    .filter(Boolean)
    .filter((email, index, arr) => arr.indexOf(email) === index)
    .filter((email) => !isInternalEmail(email));

  const phoneCandidates = extractPhoneCandidates(bestBlock);

  const rawName = extractBlockName(bestBlock);
  const name = rawName && !isInternalName(rawName) ? titleCase(rawName) : "";

  const addressCandidates = extractAddressCandidates(bestBlock);
  const address = addressCandidates[0] || "";

  let fallbackName = name;

  if (!fallbackName && emailCandidates[0]) {
    const fromEmail = emailCandidates[0]
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\d+/g, " ")
      .trim();

    if (fromEmail && !isInternalName(fromEmail)) {
      fallbackName = titleCase(fromEmail);
    }
  }

  return {
    name: fallbackName,
    phone: phoneCandidates[0] || "",
    email: emailCandidates[0] || "",
    address,
    chosenBlock: bestBlock,
  };
}

function detectJobType(text: string) {
  const lower = text.toLowerCase();

  const isQuote =
    lower.includes("quotation") ||
    lower.includes("quote") ||
    lower.includes("scope of works") ||
    lower.includes("total cost") ||
    lower.includes("+ vat") ||
    /£\s?\d+[\d,.]*/i.test(text);

  if (isQuote) {
    if (
      lower.includes("bathroom works") ||
      lower.includes("heating works") ||
      lower.includes("electrical works")
    ) {
      return "Quotation / Installation Works";
    }

    return "Quotation";
  }

  if (
    lower.includes("bathroom") ||
    lower.includes("tiles") ||
    lower.includes("grout") ||
    lower.includes("silicone") ||
    lower.includes("bath")
  ) {
    return "Bathroom works";
  }

  if (
    lower.includes("leak") ||
    lower.includes("dripping") ||
    lower.includes("damage to ceiling")
  ) {
    return "Leak investigation";
  }

  if (
    lower.includes("electric shower") ||
    lower.includes("triton") ||
    lower.includes("shower replacement")
  ) {
    return "Electric shower works";
  }

  if (
    lower.includes("radiator") ||
    lower.includes("heating") ||
    lower.includes("rebalance")
  ) {
    return "Heating works";
  }

  if (
    lower.includes("tap") ||
    lower.includes("sink") ||
    lower.includes("plug") ||
    lower.includes("waste trap") ||
    lower.includes("cistern")
  ) {
    return "Plumbing repairs";
  }

  return "General plumbing enquiry";
}

function detectRequestedWorks(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const works: string[] = [];
  let inWorksSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    const isHeading =
      lower.includes("bathroom works") ||
      lower.includes("heating works") ||
      lower.includes("electrical works") ||
      lower.includes("scope of works") ||
      lower.includes("we would carry out the following works");

    if (isHeading) {
      inWorksSection = true;
      continue;
    }

    if (
      inWorksSection &&
      (line.startsWith("•") ||
        line.startsWith("-") ||
        /^\d+[.)]/.test(line) ||
        lower.includes("supply and") ||
        lower.includes("check and test") ||
        lower.includes("drain down") ||
        lower.includes("allow for") ||
        lower.includes("seal all") ||
        lower.includes("carefully remove"))
    ) {
      const cleaned = line
        .replace(/^•\s*/, "")
        .replace(/^-+\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();

      if (cleaned) works.push(cleaned);
    }
  }

  if (works.length) {
    return [...new Set(works)];
  }

  const fallback: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("extract fan")) fallback.push("Replace extractor fan(s)");
  if (lower.includes("grout")) fallback.push("Re-grout tiled area");
  if (lower.includes("silicone") || lower.includes("silicon"))
    fallback.push("Renew silicone sealant");
  if (lower.includes("plug") || lower.includes("waste"))
    fallback.push("Check / replace basin wastes or plugs");
  if (lower.includes("waste trap") || lower.includes("waist trap"))
    fallback.push("Check waste traps for leaks");
  if (lower.includes("radiator")) fallback.push("Check / replace radiator");
  if (lower.includes("heating"))
    fallback.push("Investigate / rebalance heating");
  if (lower.includes("light")) fallback.push("Replace light fitting");
  if (lower.includes("electric shower"))
    fallback.push("Replace electric shower");

  if (!fallback.length) {
    fallback.push("Review email thread for exact scope of works");
  }

  return fallback;
}

function detectQuotedWorks(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const quoted: string[] = [];
  let inQuoteSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    const startQuoteSection =
      lower.includes("quotation") ||
      lower.includes("quote") ||
      lower.includes("scope of works") ||
      lower.includes("we would carry out the following works") ||
      lower.includes("bathroom works") ||
      lower.includes("heating works") ||
      lower.includes("electrical works");

    if (startQuoteSection) {
      inQuoteSection = true;
    }

    if (!inQuoteSection) continue;

    const isUsefulLine =
      line.startsWith("•") ||
      line.startsWith("-") ||
      /^\d+[.)]/.test(line) ||
      lower.includes("supply and") ||
      lower.includes("check and test") ||
      lower.includes("drain down") ||
      lower.includes("allow for") ||
      lower.includes("seal all") ||
      lower.includes("carefully remove") ||
      lower.includes("total cost") ||
      /£\s?\d+[\d,.]*(?:\s*\+\s*vat|\s*inc vat|\s*ex vat)?/i.test(line);

    if (isUsefulLine) {
      const cleaned = line
        .replace(/^•\s*/, "")
        .replace(/^-+\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();

      if (cleaned) quoted.push(cleaned);
    }
  }

  return [...new Set(quoted)];
}

function buildShortSummary(text: string, jobType: string, works: string[]) {
  const lower = text.toLowerCase();

  let intro = `Customer emailed regarding ${jobType.toLowerCase()}.`;

  if (lower.includes("quote")) {
    intro = `Customer emailed requesting a quote for ${jobType.toLowerCase()}.`;
  }

  let worksSentence = "";

  if (works.length === 1) {
    worksSentence = `Quoted works include ${works[0].toLowerCase()}.`;
  } else if (works.length > 1) {
    const previewItems = works.slice(0, 4).map((item) => item.toLowerCase());
    worksSentence = `Quoted works include ${previewItems.join(", ")}${
      works.length > 4 ? ", and additional listed items" : ""
    }.`;
  }

  let close = "";
  if (lower.includes("thank you for the opportunity to quote")) {
    close = "Thread includes a full quotation with listed works and pricing.";
  } else if (lower.includes("arrange") && lower.includes("quote")) {
    close =
      "Customer has asked to arrange a suitable time to attend and quote.";
  } else if (lower.includes("provide a quote")) {
    close = "Customer has requested a quotation.";
  }

  return [intro, worksSentence, close].filter(Boolean).join(" ");
}

export default function App() {
  const [emailText, setEmailText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [requestedWorks, setRequestedWorks] = useState("");
  const [quotedWorks, setQuotedWorks] = useState("");
  const [shortSummary, setShortSummary] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("Ready to import");
  const [debugBlock, setDebugBlock] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setEmailText(parsed.emailText || "");
      setCustomerName(parsed.customerName || "");
      setPhone(parsed.phone || "");
      setEmail(parsed.email || "");
      setAddress(parsed.address || "");
      setJobType(parsed.jobType || "");
      setRequestedWorks(parsed.requestedWorks || "");
      setQuotedWorks(parsed.quotedWorks || "");
      setShortSummary(parsed.shortSummary || "");
      setSummary(parsed.summary || "");
      setStatus(parsed.status || "Ready to import");
      setDebugBlock(parsed.debugBlock || "");
    } catch (error) {
      console.error("Failed to load saved state", error);
    }
  }, []);

  useEffect(() => {
    const payload = {
      emailText,
      customerName,
      phone,
      email,
      address,
      jobType,
      requestedWorks,
      quotedWorks,
      shortSummary,
      summary,
      status,
      debugBlock,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    emailText,
    customerName,
    phone,
    email,
    address,
    jobType,
    requestedWorks,
    quotedWorks,
    shortSummary,
    summary,
    status,
    debugBlock,
  ]);

  function smartExtract() {
    if (!emailText.trim()) {
      setStatus("Paste email thread first");
      return;
    }

    const result = extractDetails(emailText);

    setCustomerName(result.name);
    setPhone(result.phone);
    setEmail(result.email);
    setAddress(result.address);
    setDebugBlock(result.chosenBlock);

    setStatus("Smart extract complete");
  }

  function generateSummary() {
    if (!emailText.trim()) {
      setStatus("Paste email thread first");
      return;
    }

    const extracted = extractDetails(emailText);
    const detectedJobType = detectJobType(emailText);
    const works = detectRequestedWorks(emailText);
    const quoted = detectQuotedWorks(emailText);
    const short = buildShortSummary(emailText, detectedJobType, works);

    const finalName = extracted.name || customerName || "-";
    const finalPhone = extracted.phone || phone || "-";
    const finalEmail = extracted.email || email || "-";
    const finalAddress = extracted.address || address || "-";

    setCustomerName(finalName === "-" ? "" : finalName);
    setPhone(finalPhone === "-" ? "" : finalPhone);
    setEmail(finalEmail === "-" ? "" : finalEmail);
    setAddress(finalAddress === "-" ? "" : finalAddress);
    setJobType(detectedJobType);
    setRequestedWorks(works.map((item) => `• ${item}`).join("\n"));
    setQuotedWorks(
      quoted.length ? quoted.map((item) => `• ${item}`).join("\n") : ""
    );
    setShortSummary(short);
    setDebugBlock(extracted.chosenBlock);

    const output = `NEW ENQUIRY

Customer: ${finalName}
Phone: ${finalPhone}
Email: ${finalEmail}
Address: ${finalAddress}

Job Type:
${detectedJobType}

Short Summary:
${short}

Requested Works:
${works.map((item) => `• ${item}`).join("\n")}

Quoted Works / Scope Found:
${quoted.length ? quoted.map((item) => `• ${item}`).join("\n") : "-"}

Office Notes:
Review email thread before adding to Commusoft.`;

    setSummary(output);
    setStatus("AI job summary complete");
  }

  function copySummary() {
    navigator.clipboard.writeText(summary);
    setStatus("Summary copied");
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    setEmailText("");
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setJobType("");
    setRequestedWorks("");
    setQuotedWorks("");
    setShortSummary("");
    setSummary("");
    setDebugBlock("");
    setStatus("Cleared");
  }

  return (
    <div className="container">
      <h1>Gmail → Commusoft Importer</h1>

      <div className="card">
        <h2>1. Gmail inbox</h2>
        <p>Feature coming soon</p>
      </div>

      <div className="card">
        <h2>2. Paste Email Thread</h2>

        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste Gmail thread here"
        />

        <div className="buttons">
          <button onClick={smartExtract}>Smart Extract</button>
          <button onClick={generateSummary}>AI Job Summary</button>
          <button onClick={clearAll}>Clear</button>
        </div>
      </div>

      <div className="card">
        <h2>3. Customer Details</h2>

        <input
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <input
          placeholder="Job type"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        />

        <textarea
          placeholder="Requested works"
          value={requestedWorks}
          onChange={(e) => setRequestedWorks(e.target.value)}
        />

        <textarea
          placeholder="Quoted works / scope found"
          value={quotedWorks}
          onChange={(e) => setQuotedWorks(e.target.value)}
        />

        <textarea
          placeholder="Short summary"
          value={shortSummary}
          onChange={(e) => setShortSummary(e.target.value)}
        />
      </div>

      <div className="card">
        <h2>4. Commusoft Summary</h2>

        <textarea value={summary} readOnly />

        <button onClick={copySummary}>Copy Summary</button>
      </div>

      <div className="card">
        <h2>5. Debug</h2>
        <textarea value={debugBlock} readOnly />
      </div>

      <p className="status">Status: {status}</p>
    </div>
  );
}
